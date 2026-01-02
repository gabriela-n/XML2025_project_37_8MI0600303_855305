
let fortressCards = [];
let mainMap = null;
let mainMarkers = []; 
let currentFilter = null;
let currentSort = null;



document.addEventListener("click", (e) => {
  const btn = e.target.closest(".popup-btn");
  if (!btn) return;

  if (btn) console.log("POPUP BTN CLICK", btn.dataset.id);

  e.preventDefault();
  e.stopPropagation(); 

  

  const id = btn.dataset.id;
  console.log("ID = ", id);
  if (!id) return;

  scrollToFortress(id);
}, true);


document.addEventListener("DOMContentLoaded", () => {
  if (typeof L === "undefined") {
    console.error("Leaflet не загружен: проверьте подключение leaflet.js");
    return;
  }

  fortressCards = Array.from(document.querySelectorAll(".fortress-card"));


  initMainMap();
  initIndividualMaps();
  wireUIEvents();
});

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
    const fortressId = card.dataset.id || "none";

    if (!lat || !lon) return;

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
}

function initIndividualMaps() {
  const placeholders = document.querySelectorAll(".map-placeholder");

  placeholders.forEach((placeholder, index) => {
    const lat = parseFloat(placeholder.dataset.lat);
    const lon = parseFloat(placeholder.dataset.lon);
    const name = placeholder.dataset.name || "Крепост";

    if (!lat || !lon) return;

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
  if (!fortressId) return;

  const card = document.querySelector(`.fortress-card[data-id="${cssEscape(fortressId)}"]`);
  if (!card) return;

  card.scrollIntoView({ behavior: "smooth", block: "center" });

  card.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
  card.style.transform = "scale(1.02)";
  card.style.boxShadow = "0 16px 48px rgba(102, 126, 234, 0.5)";

  setTimeout(() => {
    card.style.transform = "";
    card.style.boxShadow = "";
  }, 1500);
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
