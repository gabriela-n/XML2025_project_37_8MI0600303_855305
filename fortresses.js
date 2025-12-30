// Глобални променливи
let fortressCards = [];
let currentFilter = null;
let currentSort = null;

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
    fortressCards = Array.from(document.querySelectorAll(".fortress-card"));
    
    initMainMap();
    initFortressMaps();
});

/* =========================
   ГЛАВНА КАРТА
========================= */
function initMainMap() {
    const map = L.map("mainMap").setView([42.7, 25.3], 7);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Цветове по тип крепост
    const colorMap = {
        'Българска': '#667eea',
        'Византийска': '#764ba2',
        'Римска': '#f093fb',
        'Тракийска': '#f5576c'
    };
    
    // Добавяме маркери за всички крепости
    fortressCards.forEach(card => {
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        const name = card.dataset.name;
        const type = card.dataset.type;
        const fortressId = card.dataset.id;
        
        if (lat && lon) {
            // Създаваме custom icon с цвят според типа
            const color = colorMap[type] || '#667eea';
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            
            const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
            
            // Popup с линк към картичката
            const popupContent = `
                <div style="text-align: center;">
                    <strong style="font-size: 1.1em;">${name}</strong><br/>
                    <em style="color: ${color};">${type} крепост</em><br/>
                    <button onclick="scrollToFortress('${fortressId}')" style="margin-top: 8px; padding: 6px 12px; background: ${color}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        🏰 Виж повече
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        }
    });
}

/* =========================
   SCROLL КЪМ КРЕПОСТ
========================= */
function scrollToFortress(fortressId) {
    const card = document.querySelector(`[data-id="${fortressId}"]`);
    if (card) {
        card.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Добавяме highlight ефект
        card.style.transition = 'all 0.3s ease';
        card.style.transform = 'scale(1.03)';
        card.style.boxShadow = '0 16px 48px rgba(102, 126, 234, 0.5)';
        
        setTimeout(() => {
            card.style.transform = '';
            card.style.boxShadow = '';
        }, 2000);
    }
}

/* =========================
   ИНДИВИДУАЛНИ КАРТИ
========================= */
function initFortressMaps() {
    fortressCards.forEach(card => {
        const fortressId = card.dataset.id;
        const lat = parseFloat(card.dataset.lat);
        const lon = parseFloat(card.dataset.lon);
        const name = card.dataset.name;
        const type = card.dataset.type;
        
        const mapElement = document.getElementById(`map_${fortressId}`);
        
        if (mapElement && lat && lon) {
            const map = L.map(`map_${fortressId}`).setView([lat, lon], 13);
            
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            
            // Цвят според типа
            const colorMap = {
                'Българска': '#667eea',
                'Византийска': '#764ba2',
                'Римска': '#f093fb',
                'Тракийска': '#f5576c'
            };
            const color = colorMap[type] || '#667eea';
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            
            L.marker([lat, lon], { icon: customIcon })
                .addTo(map)
                .bindPopup(`<strong>${name}</strong><br/><em>${type} крепост</em>`)
                .openPopup();
        }
    });
}

/* =========================
   ФИЛТРИРАНЕ ПО ТИП
========================= */
function filterByType(type) {
    const filterCards = document.querySelectorAll('.filter-card');
    const clickedCard = Array.from(filterCards).find(card => card.dataset.type === type);
    
    // Toggle активен филтър
    if (currentFilter === type) {
        // Изключваме филтъра
        currentFilter = null;
        clickedCard.classList.remove('active');
        
        // Показваме всички крепости
        fortressCards.forEach(card => {
            card.style.display = "block";
        });
    } else {
        // Включваме нов филтър
        currentFilter = type;
        
        // Премахваме active от всички карти
        filterCards.forEach(card => card.classList.remove('active'));
        
        // Добавяме active на кликнатата карта
        clickedCard.classList.add('active');
        
        // Филтрираме крепостите
        fortressCards.forEach(card => {
            if (card.dataset.type === type) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    }
}

/* =========================
   СОРТИРАНЕ
========================= */
function sortFortresses(criteria) {
    const container = document.getElementById("fortressesGrid");
    const cards = Array.from(container.children);
    
    // Toggle сортиране
    if (currentSort === criteria) {
        // Обръщаме реда
        cards.reverse();
    } else {
        currentSort = criteria;
        
        let compareFn;
        
        switch (criteria) {
            case "name":
                compareFn = (a, b) => {
                    return a.dataset.name.localeCompare(b.dataset.name, "bg");
                };
                break;
            
            case "type":
                compareFn = (a, b) => {
                    return a.dataset.type.localeCompare(b.dataset.type, "bg");
                };
                break;
            
            case "preservation":
                compareFn = (a, b) => {
                    return a.dataset.preservation.localeCompare(b.dataset.preservation, "bg");
                };
                break;
            
            case "fee":
                compareFn = (a, b) => {
                    const feeA = parseFloat(a.dataset.fee) || 0;
                    const feeB = parseFloat(b.dataset.fee) || 0;
                    return feeA - feeB;
                };
                break;
            
            default:
                return;
        }
        
        cards.sort(compareFn);
    }
    
    // Пренареждаме DOM елементите
    cards.forEach(card => container.appendChild(card));
}