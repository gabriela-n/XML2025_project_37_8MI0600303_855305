let fortressCards = [];
let mainMap = null;
let mainMarkers = [];
let currentFilter = null;
let currentSort = null;

const XML_MAP = {
  fortressNode: ["fortress", "крепост", "item"],

  id: ["@id", "@xml:id", "id", "code", "slug"],
  name: ["name", "title", "име", "название"],
  type: ["type", "kind", "тип"],
  preservation: ["preservation-status", "preservation", "status", "запазеност"],
workHours: ["working-hours", "workHours", "hours", "работноВреме"],
fee: ["entrance-fee", "fee", "price", "tax", "такса"],
province: ["areaRef", "province", "oblast", "област"],
settlement: ["city", "town", "settlement", "град"],

  region: ["region", "регион"],
  buildPeriod: ["buildPeriod", "built-era", "епоха", "строеж"],
  usePeriod: ["usePeriod", "main-use", "употреба"],
  description: ["description", "desc", "описание"],
  image: ["image", "img", "photo", "снимка"],

  lat: ["@lat", "lat", "latitude", "ширина"],
  lon: ["@lon", "lon", "lng", "longitude", "дължина"],

  featureList: ["features", "attractions", "забележителности"],
  featureItem: ["feature", "item", "li", "точка"],
};


function firstByTag(node, tagNames) {
  for (const t of tagNames) {
    if (t.startsWith("@")) {
      const attr = t.slice(1);
      const v = node.getAttribute?.(attr);
      if (v != null && String(v).trim() !== "") return String(v).trim();
      continue;
    }

    const el = node.getElementsByTagName(t)[0];
    if (el && el.textContent && el.textContent.trim() !== "") return el.textContent.trim();
  }
  return "";
}

function getFortressNodes(xmlDoc) {
  for (const name of XML_MAP.fortressNode) {
    const nodes = Array.from(xmlDoc.getElementsByTagName(name));
    if (nodes.length) return nodes;
  }
  const root = xmlDoc.documentElement;
  return root ? Array.from(root.children) : [];
}

function toId(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  return s
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("ъ", "a")
    .replaceAll("ь", "")
    .replaceAll("ч", "ch")
    .replaceAll("ш", "sh")
    .replaceAll("щ", "sht")
    .replaceAll("ж", "zh")
    .replaceAll("ю", "yu")
    .replaceAll("я", "ya")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-+/g, "-");
}

function parseFeatures(node) {
  let container = null;
  for (const t of XML_MAP.featureList) {
    const el = node.getElementsByTagName(t)[0];
    if (el) { container = el; break; }
  }
  if (!container) return [];

  const items = [];
  for (const itTag of XML_MAP.featureItem) {
    const els = Array.from(container.getElementsByTagName(itTag));
    for (const el of els) {
      const text = (el.textContent || "").trim();
      if (text) items.push(text);
    }
    if (items.length) break;
  }
  return items;
}


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

function cssEscape(str) {
  return String(str).replaceAll('"', '\\"');
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof L === "undefined") {
    console.error("Leaflet не загружен: проверьте подключение leaflet.js");
    return;
  }

  try {
    const fortresses = await loadFortressesFromXML("./fortresses.xml");
    renderFortresses(fortresses);
    renderFilterTypes(fortresses);

    fortressCards = Array.from(document.querySelectorAll(".fortress-card"));

    initMainMap();
    initIndividualMaps();
    wireUIEvents();
  } catch (err) {
    console.error("Ошибка загрузки/парсинга XML:", err);
    document.getElementById("fortressesGrid").innerHTML =
      `<div style="padding:16px; background:#fff; border-radius:10px;">
        <strong>Грешка:</strong> не успях да заредя fortresses.xml
      </div>`;
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".popup-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = btn.dataset.id;
  if (!id) {
    console.warn("popup-btn без data-id. Провери data-id в .fortress-card");
    return;
  }

  scrollToFortress(id);
}, true);

async function loadFortressesFromXML(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} при GET ${url}`);

  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, "application/xml");

  const parseError = xml.getElementsByTagName("parsererror")[0];
  if (parseError) throw new Error("XML parsererror: " + parseError.textContent);

  const nodes = getFortressNodes(xml);

  const list = nodes.map((n, idx) => {
    const rawId = firstByTag(n, XML_MAP.id);
    const name = firstByTag(n, XML_MAP.name) || `Fortress ${idx + 1}`;
    const id = toId(rawId || name || idx);

    const type = firstByTag(n, XML_MAP.type);
    const preservation = firstByTag(n, XML_MAP.preservation);
    const fee = firstByTag(n, XML_MAP.fee);
    const region = firstByTag(n, XML_MAP.region);
    const province = firstByTag(n, XML_MAP.province);
    const settlement = firstByTag(n, XML_MAP.settlement);
    const buildPeriod = firstByTag(n, XML_MAP.buildPeriod);
    const usePeriod = firstByTag(n, XML_MAP.usePeriod);
    const workHours = firstByTag(n, XML_MAP.workHours);
    const description = firstByTag(n, XML_MAP.description);
    const image = firstByTag(n, XML_MAP.image);

    const lat = firstByTag(n, XML_MAP.lat);
    const lon = firstByTag(n, XML_MAP.lon);

    const features = parseFeatures(n);

    return {
      id,
      name,
      type,
      preservation,
      fee,
      region,
      province,
      settlement,
      buildPeriod,
      usePeriod,
      workHours,
      description,
      image,
      lat,
      lon,
      features,
    };
  });

  return list.filter(x => x.name && x.id);
}

function renderFortresses(list) {
  const grid = document.getElementById("fortressesGrid");
  if (!grid) return;

  grid.innerHTML = list.map(f => {
    const imgSrc = f.image ? `images/${f.image}` : "";
    const showImg = imgSrc
      ? `<img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(f.name)}">`
      : `<span>Няма снимка</span>`;

    const feeText = f.fee ? `${escapeHtml(f.fee)} лв` : "—";
    const coordsText = (f.lat && f.lon) ? `${escapeHtml(f.lat)}, ${escapeHtml(f.lon)}` : "—";

    const featuresHtml = (f.features && f.features.length)
      ? `<ul>${f.features.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
      : `<ul><li>—</li></ul>`;

    return `
<article class="fortress-card"
  data-id="${escapeAttr(f.id)}"
  data-type="${escapeAttr(f.type || "")}"
  data-name="${escapeAttr(f.name || "")}"
  data-preservation="${escapeAttr(f.preservation || "")}"
  data-fee="${escapeAttr(f.fee || "0")}"
  data-lat="${escapeAttr(f.lat || "")}"
  data-lon="${escapeAttr(f.lon || "")}"
>
  <div class="fortress-image">
    ${showImg}
  </div>

  <h2 class="fortress-title">${escapeHtml(f.name)}</h2>
  <hr>

  <div class="info-box">
    <p><strong>Тип:</strong> ${escapeHtml(f.type || "—")}</p>
    <p><strong>Регион:</strong> ${escapeHtml(f.region || "—")}</p>
    <p><strong>Област:</strong> ${escapeHtml(f.province || "—")}</p>
    <p><strong>Град/Село:</strong> ${escapeHtml(f.settlement || "—")}</p>
  </div>

  <div class="status-box">
    <strong>Запазеност:</strong>
    <span>${escapeHtml(f.preservation || "—")}</span>
  </div>

  <div class="period-box">
    <p><strong>Епоха на построяване:</strong> ${escapeHtml(f.buildPeriod || "—")}</p>
    <p><strong>Основна употреба:</strong> ${escapeHtml(f.usePeriod || "—")}</p>
  </div>

  <section class="description">
    ${escapeHtml(f.description || "—")}
  </section>

  <section class="features">
    <h3>Забележителности</h3>
    ${featuresHtml}
  </section>

  <section class="visitor-box">
    <p><strong>Такса:</strong> ${feeText}</p>
    <p><strong>Работно време:</strong> ${escapeHtml(f.workHours || "—")}</p>
  </section>

  <section class="map-box">
    <p><strong>Координати:</strong> ${coordsText}</p>
    <div class="map-placeholder"
      data-lat="${escapeAttr(f.lat || "")}"
      data-lon="${escapeAttr(f.lon || "")}"
      data-name="${escapeAttr(f.name || "")}"
    ></div>
  </section>
</article>
    `.trim();
  }).join("\n");
}

function renderFilterTypes(list) {
  const wrap = document.getElementById("filterTypes");
  if (!wrap) return;

  const types = Array.from(new Set(list.map(x => x.type).filter(Boolean)));

  const fallback = ["Българска", "Византийска", "Римска", "Тракийска"];
  const finalTypes = types.length ? types : fallback;

  wrap.innerHTML = finalTypes.map(t =>
    `<div class="filter-card" data-type="${escapeAttr(t)}">${escapeHtml(t)}</div>`
  ).join("");
}

function initMainMap() {
  const mapEl = document.getElementById("mainMap");
  if (!mapEl) {
    console.error("#mainMap не найден в HTML");
    return;
  }

  if (mainMap) {
    mainMap.remove();
    mainMap = null;
    mainMarkers = [];
  }

  mainMap = L.map("mainMap").setView([42.7, 25.3], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mainMap);

  const colorMap = {
    "Българска": "#667eea",
    "Византийска": "#764ba2",
    "Римска": "#f093fb",
    "Тракийска": "#f5576c",
  };

  fortressCards.forEach((card) => {
    const lat = parseFloat(card.dataset.lat);
    const lon = parseFloat(card.dataset.lon);
    const name = card.dataset.name || "Крепост";
    const type = card.dataset.type || "";
    const fortressId = card.dataset.id || "";

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const color = colorMap[type] || "#667eea";

    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background:${color};
        width:24px;height:24px;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(mainMap);

    marker.bindPopup(`
      <div style="text-align:center;">
        <strong style="font-size:1.1em;">${escapeHtml(name)}</strong><br/>
        <em style="color:${color};">${escapeHtml(type)} крепост</em><br/>
        <button class="popup-btn" data-id="${escapeAttr(fortressId)}"
          style="margin-top:8px;padding:6px 12px;background:${color};color:#fff;border:none;border-radius:6px;cursor:pointer;">
          🏰 Виж повече
        </button>
      </div>
    `);

    mainMarkers.push({ marker, card, type });
  });

  setTimeout(() => mainMap.invalidateSize(), 0);
}

function initIndividualMaps() {
  const placeholders = document.querySelectorAll(".map-placeholder");

  placeholders.forEach((placeholder, index) => {
    const lat = parseFloat(placeholder.dataset.lat);
    const lon = parseFloat(placeholder.dataset.lon);
    const name = placeholder.dataset.name || "Крепост";

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    placeholder.id = `fortress-map-${index}`;
    placeholder.style.height = "250px";
    placeholder.innerHTML = "";

    const map = L.map(placeholder.id, {
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([lat, lon], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker([lat, lon]).addTo(map).bindPopup(`<strong>${escapeHtml(name)}</strong>`);

    setTimeout(() => map.invalidateSize(), 0);
  });
}

function wireUIEvents() {
  document.querySelectorAll(".filter-card").forEach((card) => {
    card.addEventListener("click", () => filterByType(card.dataset.type));
  });

  document.querySelectorAll(".sorting button").forEach((btn) => {
    btn.addEventListener("click", () => sortFortresses(btn.dataset.sort));
  });
}

function filterByType(type) {
  if (currentFilter === type) {
    currentFilter = null;

    fortressCards.forEach((card) => (card.style.display = "flex"));
    mainMarkers.forEach(({ marker }) => {
      if (!mainMap.hasLayer(marker)) marker.addTo(mainMap);
    });

    document.querySelectorAll(".filter-card").forEach((c) => c.classList.remove("active"));
  } else {
    currentFilter = type;

    fortressCards.forEach((card) => {
      card.style.display = card.dataset.type === type ? "flex" : "none";
    });

    mainMarkers.forEach(({ marker, type: markerType }) => {
      if (markerType === type) {
        if (!mainMap.hasLayer(marker)) marker.addTo(mainMap);
      } else {
        if (mainMap.hasLayer(marker)) mainMap.removeLayer(marker);
      }
    });

    document.querySelectorAll(".filter-card").forEach((c) => {
      c.classList.toggle("active", c.dataset.type === type);
    });
  }

  mainMap?.invalidateSize();
}

function sortFortresses(criteria) {
  const container = document.getElementById("fortressesGrid");
  if (!container) return;

  const cards = Array.from(container.children);

  if (currentSort === criteria) {
    currentSort = null;

    const originalOrder = new Map(fortressCards.map((c, i) => [c, i]));
    cards.sort((a, b) => (originalOrder.get(a) ?? 0) - (originalOrder.get(b) ?? 0));
  } else {
    currentSort = criteria;

    let compareFn = null;

    switch (criteria) {
      case "name":
        compareFn = (a, b) => (a.dataset.name || "").localeCompare(b.dataset.name || "", "bg");
        break;
      case "type":
        compareFn = (a, b) => (a.dataset.type || "").localeCompare(b.dataset.type || "", "bg");
        break;
      case "preservation":
        compareFn = (a, b) =>
          (a.dataset.preservation || "").localeCompare(b.dataset.preservation || "", "bg");
        break;
      case "fee":
        compareFn = (a, b) => parseFloat(a.dataset.fee || "0") - parseFloat(b.dataset.fee || "0");
        break;
      default:
        return;
    }

    cards.sort(compareFn);
  }

  cards.forEach((card) => container.appendChild(card));
}

function scrollToFortress(fortressId) {
  const card = document.querySelector(`.fortress-card[data-id="${cssEscape(fortressId)}"]`);
  if (!card) {
    console.warn("Не найдена карточка по data-id =", fortressId);
    return;
  }

  card.scrollIntoView({ behavior: "smooth", block: "center" });

  card.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
  card.style.transform = "scale(1.02)";
  card.style.boxShadow = "0 16px 48px rgba(102, 126, 234, 0.5)";

  setTimeout(() => {
    card.style.transform = "";
    card.style.boxShadow = "";
  }, 1500);
}
