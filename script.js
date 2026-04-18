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

let user = null;
let gameData = {
    clicks: 0,
    rebirths: 0,
    multiplier: 1,
    upgradeLevel: 0,
    pets: []
};

// --- AUTH SYSTEM ---
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Gagal Login: " + err.message));
}

// LOGOUT DENGAN PAKSA SIMPAN DATA
async function logout() {
    if (user) {
        // Tampilkan loading sebentar jika perlu
        await saveData(); // Pastikan data terkirim ke cloud sebelum sign out
        auth.signOut().then(() => {
            location.reload();
        });
    }
}

auth.onAuthStateChanged(async (u) => {
    if (u) {
        user = u;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Setup UI Profil
        document.getElementById('user-photo').src = u.photoURL;
        document.getElementById('display-name').innerText = u.displayName;
        document.getElementById('f-user').value = u.email;

        await loadData(); // Ambil data terbaru dari akun Google
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('game-container').style.display = 'none';
    }
});

// --- DATA SINKRONISASI (CORE) ---

// 1. Ambil Data dari Cloud saat Login
async function loadData() {
    try {
        const doc = await db.collection("players").doc(user.uid).get();
        if (doc.exists) {
            gameData = doc.data();
            recalcMult(); // Hitung ulang multiplier berdasarkan pet yang dimiliki
            updateUI();
        } else {
            // Jika akun baru, buat data awal di cloud
            await saveData();
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

// 2. Simpan Data ke Cloud
async function saveData() {
    if (user) {
        try {
            await db.collection("players").doc(user.uid).set(gameData);
        } catch (e) {
            console.error("Gagal menyimpan ke cloud:", e);
        }
    }
}

// 3. Simpan saat Browser Ditutup / Refresh
window.addEventListener('beforeunload', (event) => {
    if (user) {
        saveData(); // Jalankan penyimpanan terakhir
    }
});

// --- GAME LOGIC ---

function handleButtonClick(e) {
    const power = (1 + gameData.upgradeLevel) * gameData.multiplier;
    gameData.clicks += power;
    
    createFloatingText(e.clientX, e.clientY, `+${Math.floor(power)}`);
    updateUI();
    
    // Auto-save setiap beberapa klik (Opsional: agar tidak membebani database)
    if (gameData.clicks % 5 === 0) {
        saveData();
    }
}

function buyUpgrade() {
    const cost = (gameData.upgradeLevel + 1) * 150;
    const max = (gameData.rebirths + 1) * 10;

    if (gameData.upgradeLevel >= max) {
        alert("Butuh lebih banyak Rebirth!");
        return;
    }

    if (gameData.clicks >= cost) {
        gameData.clicks -= cost;
        gameData.upgradeLevel++;
        updateUI();
        saveData(); // Langsung simpan saat upgrade
    }
}

function doRebirth() {
    const cost = (gameData.rebirths + 1) * 10000;
    if (gameData.clicks >= cost) {
        gameData.clicks = 0;
        gameData.rebirths++;
        gameData.upgradeLevel = 0; // Reset upgrade level sesuai simulasi umum
        updateUI();
        saveData(); // Langsung simpan saat rebirth
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
            if (rand <= pool) {
                selected = p;
                break;
            }
        }

        gameData.pets.push(selected);
        recalcMult();
        updateUI();
        saveData(); // Simpan koleksi pet baru
        alert(`Selamat! Anda mendapatkan Pet ${selected.name}!`);
    }
}

// --- FUNGSI PENDUKUNG ---

function recalcMult() {
    let m = 1;
    if (gameData.pets) {
        gameData.pets.forEach(p => {
            m += p.mult;
        });
    }
    gameData.multiplier = m;
}

function updateUI() {
    document.getElementById('clicks').innerText = Math.floor(gameData.clicks).toLocaleString();
    document.getElementById('rebirths').innerText = gameData.rebirths;
    document.getElementById('multiplier-display').innerText = `Multiplier: x${gameData.multiplier}`;
    
    const upBtn = document.getElementById('upgrade-btn');
    if(upBtn) {
        upBtn.innerText = `Upgrade (${((gameData.upgradeLevel + 1) * 150).toLocaleString()} 💖)`;
        document.getElementById('upgrade-info').innerText = `Click Power (Lvl ${gameData.upgradeLevel})`;
        document.getElementById('upgrade-req').innerText = `Max: ${(gameData.rebirths + 1) * 10} (Berdasarkan Rebirth)`;
    }

    const rbCost = document.getElementById('rebirth-cost');
    if(rbCost) rbCost.innerText = `Syarat: ${((gameData.rebirths + 1) * 10000).toLocaleString()} 💖`;

    // Render Pets di Inventory
    const list = document.getElementById('pet-list');
    if (list) {
        list.innerHTML = "";
        gameData.pets.forEach(p => {
            const div = document.createElement('div');
            div.className = 'stat-box';
            div.style.fontSize = '8px';
            div.innerHTML = `${p.name}<br>x${p.mult}`;
            list.appendChild(div);
        });
    }
}

function createFloatingText(x, y, txt) {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.innerText = txt;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

function togglePopup(id) {
    const p = document.getElementById(id);
    p.style.display = (p.style.display === 'flex') ? 'none' : 'flex';
}

// reCAPTCHA Callback
function onCaptchaSuccess(token) {
    if (token) {
        const captchaOverlay = document.getElementById('captcha-overlay');
        captchaOverlay.style.opacity = '0';
        setTimeout(() => {
            captchaOverlay.style.display = 'none';
        }, 500);
    }
}
