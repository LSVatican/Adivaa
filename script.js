let gameData = {
    clicks: 0,
    rebirths: 0,
    multiplier: 1,
    upgradeLevel: 0,
    pets: []
};

const petRarities = [
    { name: "Common", chance: 70, mult: 2 },
    { name: "Rare", chance: 20, mult: 5 },
    { name: "Epic", chance: 8, mult: 15 },
    { name: "Legendary", chance: 2, mult: 50 }
];

// Load Data
if (localStorage.getItem('adivaa_save')) {
    gameData = JSON.parse(localStorage.getItem('adivaa_save'));
    updateUI();
}

function handleButtonClick(e) {
    const clickPower = (1 + gameData.upgradeLevel) * gameData.multiplier;
    gameData.clicks += clickPower;
    
    // Floating Text
    createFloatingText(e.clientX, e.clientY, `+${clickPower}`);
    updateUI();
    saveGame();
}

function createFloatingText(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function togglePopup(id) {
    const pop = document.getElementById(id);
    pop.style.display = (pop.style.display === 'flex') ? 'none' : 'flex';
    if (id === 'pet-popup') renderPets();
}

function buyUpgrade() {
    const cost = (gameData.upgradeLevel + 1) * 100;
    const maxAllowed = (gameData.rebirths + 1) * 10; // Syarat Max Upgrade

    if (gameData.upgradeLevel >= maxAllowed) {
        alert("Butuh lebih banyak Rebirth untuk upgrade lagi!");
        return;
    }

    if (gameData.clicks >= cost) {
        gameData.clicks -= cost;
        gameData.upgradeLevel++;
        updateUI();
        saveGame();
    }
}

function doRebirth() {
    const cost = (gameData.rebirths + 1) * 10000;
    if (gameData.clicks >= cost) {
        gameData.clicks = 0;
        gameData.rebirths++;
        gameData.upgradeLevel = 0;
        updateUI();
        saveGame();
        togglePopup('rebirth-popup');
    }
}

function buyPet() {
    if (gameData.clicks >= 500) {
        gameData.clicks -= 500;
        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedPet = petRarities[0];

        for (let p of petRarities) {
            cumulative += p.chance;
            if (rand <= cumulative) {
                selectedPet = p;
                break;
            }
        }
        
        gameData.pets.push(selectedPet);
        calculateMultiplier();
        alert(`Anda mendapatkan Pet ${selectedPet.name}!`);
        updateUI();
        saveGame();
    }
}

function calculateMultiplier() {
    let m = 1;
    gameData.pets.forEach(p => m += p.mult);
    gameData.multiplier = m;
}

function renderPets() {
    const container = document.getElementById('pet-list');
    container.innerHTML = "";
    gameData.pets.forEach(p => {
        const div = document.createElement('div');
        div.className = 'stat-box';
        div.style.fontSize = '10px';
        div.innerHTML = `${p.name}<br>x${p.mult}`;
        container.appendChild(div);
    });
}

function updateUI() {
    document.getElementById('clicks').innerText = Math.floor(gameData.clicks).toLocaleString();
    document.getElementById('rebirths').innerText = gameData.rebirths;
    document.getElementById('multiplier-display').innerText = `Multiplier: x${gameData.multiplier}`;
    document.getElementById('upgrade-info').innerText = `Click Power (Level ${gameData.upgradeLevel})`;
    document.getElementById('upgrade-btn').innerText = `Upgrade (${(gameData.upgradeLevel + 1) * 100} 💖)`;
    document.getElementById('upgrade-requirement').innerText = `Max Level: ${(gameData.rebirths + 1) * 10} (Tergantung Rebirth)`;
    document.getElementById('rebirth-cost').innerText = `Syarat: ${((gameData.rebirths + 1) * 10000).toLocaleString()} 💖`;
}

function saveGame() {
    localStorage.setItem('adivaa_save', JSON.stringify(gameData));
}
