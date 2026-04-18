const translations = {
    id: { shop: "Toko", pets: "Pet", upgrades: "Upgrade", rebirth: "Rebirth", petShopTitle: "Toko Pet", inventoryTitle: "Invetori Pet", upgradeTitle: "Peningkat Klik", rebirthTitle: "Rebirth" },
    en: { shop: "Shop", pets: "Pets", upgrades: "Upgrades", rebirth: "Rebirth", petShopTitle: "Pet Shop", inventoryTitle: "Pet Inventory", upgradeTitle: "Click Upgrades", rebirthTitle: "Rebirth" },
    jp: { shop: "ショップ", pets: "ペット", upgrades: "強化", rebirth: "転生", petShopTitle: "ペットショップ", inventoryTitle: "目録", upgradeTitle: "アップグレード", rebirthTitle: "転生" },
    kr: { shop: "상점", pets: "펫", upgrades: "강화", rebirth: "환생", petShopTitle: "펫 상점", inventoryTitle: "인벤토리", upgradeTitle: "업그레이드", rebirthTitle: "환생" },
    fr: { shop: "Boutique", pets: "Animaux", upgrades: "Améliorer", rebirth: "Renaissance", petShopTitle: "Boutique d'animaux", inventoryTitle: "Inventaire", upgradeTitle: "Améliorations", rebirthTitle: "Renaissance" }
};

function changeLanguage() {
    const lang = document.getElementById('lang-select').value;
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        el.innerText = translations[lang][key];
    });
}
