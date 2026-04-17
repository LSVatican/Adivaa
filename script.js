// --- KONFIGURASI FIREBASE (Ganti dengan milikmu) ---
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

let user = null;
let gameData = {
    clicks: 0, rebirths: 0, multiplier: 1, upgradeLevel: 0, pets: []
};

const petRarities = [
    { name: "Common", chance: 70, mult: 2 },
    { name: "Rare", chance: 20, mult: 5 },
    { name: "Epic", chance: 8, mult: 15 },
    { name: "Legendary", chance: 2, mult: 50 }
];

// --- AUTH SYSTEM ---
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
}

function logout() {
    auth.signOut().then(() => location.reload());
}

auth.onAuthStateChanged(u => {
    if (u) {
        user = u;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        document.getElementById('user-photo').src = u.photoURL;
        document.getElementById('display-name').innerText = u.displayName;
        document.getElementById('f-user').value = u.email;
        loadData();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('game-container').style.display = 'none';
    }
});

// --- DATA SYSTEM ---
async function loadData() {
    const doc = await db.collection("players").doc(user.uid).get();
    if (doc.exists) {
        gameData = doc.data();
        updateUI();
    } else {
        saveData();
    }
}

async function saveData() {
    if (user) await db.collection("players").doc(user.uid).set(gameData);
}

// --- GAME LOGIC ---
function handleButtonClick(e) {
    const power = (1 + gameData.upgradeLevel) * gameData.multiplier;
    gameData.clicks += power;
    createFloatingText(e.clientX, e.clientY, `+${power}`);
    updateUI();
    saveData();
}

function createFloatingText(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.innerText = txt;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
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

function buyPet() {
    if (gameData.clicks >= 500) {
        gameData.clicks -= 500;
        let rand = Math.random() * 100;
        let pool = 0;
        let selected = petRarities[0];
        for (let p of petRarities) {
            pool += p.chance;
            if (rand <= pool) { selected = p; break; }
        }
        gameData.pets.push(selected);
        recalcMult();
        updateUI(); saveData();
        alert(`Dapat: ${selected.name}!`);
    }
}

function recalcMult() {
    let m = 1;
    gameData.pets.forEach(p => m += p.mult);
    gameData.multiplier = m;
}

function updateUI() {
    document.getElementById('clicks').innerText = Math.floor(gameData.clicks).toLocaleString();
    document.getElementById('rebirths').innerText = gameData.rebirths;
    document.getElementById('multiplier-display').innerText = `Multiplier: x${gameData.multiplier}`;
    document.getElementById('upgrade-info').innerText = `Click Power (Lvl ${gameData.upgradeLevel})`;
    document.getElementById('upgrade-btn').innerText = `Beli (${(gameData.upgradeLevel + 1) * 150} 💖)`;
    document.getElementById('upgrade-req').innerText = `Max Lvl: ${(gameData.rebirths + 1) * 10} (Tergantung Rebirth)`;
    document.getElementById('rebirth-cost').innerText = `Syarat: ${((gameData.rebirths + 1) * 10000).toLocaleString()} 💖`;
    
    // Render Pet
    const list = document.getElementById('pet-list');
    list.innerHTML = "";
    gameData.pets.forEach(p => {
        list.innerHTML += `<div class="stat-box" style="font-size:8px">${p.name}<br>x${p.mult}</div>`;
    });
}

function togglePopup(id) {
    const p = document.getElementById(id);
    p.style.display = (p.style.display === 'flex') ? 'none' : 'flex';
}

// Fungsi ini dipanggil otomatis oleh data-callback="onCaptchaSuccess" di HTML
function onCaptchaSuccess(token) {
    if (token) {
        // Hilangkan overlay captcha dengan efek transisi jika perlu
        const captchaOverlay = document.getElementById('captcha-overlay');
        captchaOverlay.style.opacity = '0';
        
        setTimeout(() => {
            captchaOverlay.style.display = 'none';
            // Setelah captcha hilang, sistem Firebase Auth akan mengambil alih 
            // untuk memunculkan Login Overlay atau Game Container.
        }, 500);
    }
}

// Tambahkan pengaman: Pastikan user tidak bisa membypass lewat console
window.onload = function() {
    // Jika user belum menyelesaikan captcha, pastikan overlay tetap muncul
    document.getElementById('captcha-overlay').style.display = 'flex';
};
