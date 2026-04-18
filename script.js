// --- CONFIG FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyASp9AMNVaCmnAOWnrXsq7r53gWvWTeznU",
  authDomain: "adivaa-ae010.firebaseapp.com",
  projectId: "adivaa-ae010",
  storageBucket: "adivaa-ae010.firebasestorage.app",
  messagingSenderId: "330863761504",
  appId: "1:330863761504:web:720a9e67d25ac8be3f4b05"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Daftar Kelangkaan Pet (Global)
const petRarities = [
    { name: "Common", chance: 70, mult: 2 },
    { name: "Rare", chance: 20, mult: 5 },
    { name: "Epic", chance: 8, mult: 15 },
    { name: "Legendary", chance: 2, mult: 50 }
];

let user = null;
let gameData = {
    clicks: 0,
    rebirths: 0,
    multiplier: 1,
    upgradeLevel: 0,
    pets: [] // Pastikan ini selalu array
};

// --- AUTH ---
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
}

async function logout() {
    if (user) {
        await saveData();
        auth.signOut().then(() => location.reload());
    }
}

auth.onAuthStateChanged(async (u) => {
    if (u) {
        user = u;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        document.getElementById('user-photo').src = u.photoURL;
        document.getElementById('display-name').innerText = u.displayName;
        document.getElementById('f-user').value = u.email;
        await loadData();
    } else {
        // Tampilkan login jika captcha sudah selesai
        if(document.getElementById('captcha-overlay').style.display === 'none') {
            document.getElementById('login-overlay').style.display = 'flex';
        }
    }
});

// --- DATA SYSTEM (CLOUD) ---
async function loadData() {
    const doc = await db.collection("players").doc(user.uid).get();
    if (doc.exists) {
        gameData = doc.data();
        // FIX: Pastikan array pets ada jika data lama tidak punya
        if (!gameData.pets) gameData.pets = [];
        recalcMult();
        updateUI();
    } else {
        await saveData();
    }
}

async function saveData() {
    if (user) {
        await db.collection("players").doc(user.uid).set(gameData);
    }
}

// Simpan saat browser ditutup atau direfresh
window.onbeforeunload = function() {
    if (user) saveData();
};

// --- GAME LOGIC ---
function handleButtonClick(e) {
    const power = (1 + gameData.upgradeLevel) * gameData.multiplier;
    gameData.clicks += power;
    createFloatingText(e.clientX, e.clientY, `+${Math.floor(power)}`);
    updateUI();
    if (gameData.clicks % 10 === 0) saveData(); // Auto-save tiap 10 klik
}

function buyUpgrade() {
    const cost = (gameData.upgradeLevel + 1) * 150;
    const max = (gameData.rebirths + 1) * 10;
    if (gameData.upgradeLevel >= max) return alert("Butuh Rebirth!");
    if (gameData.clicks >= cost) {
        gameData.clicks -= cost;
        gameData.upgradeLevel++;
        updateUI(); saveData();
    }
}

function doRebirth() {
    const cost = (gameData.rebirths + 1) * 10000;
    if (gameData.clicks >= cost) {
        gameData.clicks = 0;
        gameData.rebirths++;
        gameData.upgradeLevel = 0;
        updateUI(); saveData();
        togglePopup('rebirth-popup');
    }
}

// FIX: Fungsi Buy Pet yang diperbaiki
function buyPet() {
    if (gameData.clicks >= 500) {
        gameData.clicks -= 500;
        
        let rand = Math.random() * 100;
        let pool = 0;
        let selected = petRarities[0];

        for (let p of petRarities) {
            pool += p.chance;
            if (rand <= pool) {
                selected = p;
                break;
            }
        }

        // Pastikan array ada sebelum push
        if (!gameData.pets) gameData.pets = [];
        gameData.pets.push(selected);
        
        recalcMult();
        updateUI();
        saveData(); // Simpan ke Cloud
        alert(`Dapat Pet: ${selected.name}! Multiplier naik!`);
    } else {
        alert("💖 Clicks tidak cukup!");
    }
}

function recalcMult() {
    let m = 1;
    if (gameData.pets) {
        gameData.pets.forEach(p => m += p.mult);
    }
    gameData.multiplier = m;
}

function updateUI() {
    document.getElementById('clicks').innerText = Math.floor(gameData.clicks).toLocaleString();
    document.getElementById('rebirths').innerText = gameData.rebirths;
    document.getElementById('multiplier-display').innerText = `Multiplier: x${gameData.multiplier}`;
    
    const upBtn = document.getElementById('upgrade-btn');
    if (upBtn) {
        upBtn.innerText = `Upgrade (${(gameData.upgradeLevel + 1) * 150} 💖)`;
        document.getElementById('upgrade-info').innerText = `Click Power (Lvl ${gameData.upgradeLevel})`;
        document.getElementById('upgrade-req').innerText = `Max: ${(gameData.rebirths + 1) * 10} (By Rebirth)`;
    }
    
    document.getElementById('rebirth-cost').innerText = `Syarat: ${((gameData.rebirths + 1) * 10000).toLocaleString()} 💖`;
    
    // Render Inventory
    const list = document.getElementById('pet-list');
    list.innerHTML = "";
    if (gameData.pets) {
        gameData.pets.forEach(p => {
            list.innerHTML += `<div class="stat-box" style="font-size:8px; margin:2px;">${p.name}<br>x${p.mult}</div>`;
        });
    }
}

// --- UTILS ---
function createFloatingText(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.innerText = txt;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

function togglePopup(id) {
    const p = document.getElementById(id);
    p.style.display = (p.style.display === 'flex') ? 'none' : 'flex';
}

function onCaptchaSuccess(token) {
    if (token) {
        document.getElementById('captcha-overlay').style.display = 'none';
        if (!user) document.getElementById('login-overlay').style.display = 'flex';
    }
}
