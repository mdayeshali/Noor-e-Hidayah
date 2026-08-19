/* =======================================================
   🕌 Islamic Light — High-Performance Prayer Times Engine
   Author: Md Ayesh Ali | IslamicLight.in
========================================================= */

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর
function toBnNum(str) {
  if (!str) return '';
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return str.toString().replace(/\d/g, d => bn[d]);
}

// ২৪ ঘণ্টার সময় ফরম্যাটকে ১২ ঘণ্টার বাংলা ফরম্যাটে রূপান্তর
function format12Hour(time24) {
  if (!time24) return '--:--';
  const cleanTime = time24.split(' ')[0]; // (e.g. "05:12 (IST)" -> "05:12")
  let [hours, minutes] = cleanTime.split(':').map(Number);
  
  const ampm = hours >= 12 ? 'পিএম' : 'এএম';
  hours = hours % 12 || 12;
  
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  return `${toBnNum(hours)}:${toBnNum(formattedMinutes)} ${ampm}`;
}

// গ্লোবাল স্টেট
let prayerTimesToday = null;
let countdownInterval = null;

// ডিফল্ট অবস্থান (লোকেশন পারমিশন না দিলে ব্যবহার হবে)
const DEFAULT_LAT = 24.8949; // Sultanganj / Malda Region default
const DEFAULT_LNG = 87.9710;
const DEFAULT_CITY = "মালদা / পশ্চিমবঙ্গ";

/* -------------------------------------------------------
   ১. প্রধান ইনিশিয়ালাইজেশন
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // মাযহাব লোড (হানাফি ডিফল্ট = 1, শাফি = 0)
  const savedMadhab = localStorage.getItem('islamicMadhab') || "1";
  const madhabSelect = document.getElementById('madhabSelect');
  if (madhabSelect) madhabSelect.value = savedMadhab;

  initPrayerLocation();
});

/* -------------------------------------------------------
   ২. ইউজার লোকেশন হ্যান্ডলার
--------------------------------------------------------- */
function initPrayerLocation() {
  const locEl = document.getElementById('locationText');

  // ক্যাশ করা লোকেশন চেক
  const cachedLat = localStorage.getItem('userLat');
  const cachedLng = localStorage.getItem('userLng');
  const cachedCity = localStorage.getItem('userCity');

  if (cachedLat && cachedLng) {
    if (locEl) locEl.innerText = cachedCity || DEFAULT_CITY;
    fetchPrayerTimes(cachedLat, cachedLng);
  } else if (navigator.geolocation) {
    if (locEl) locEl.innerText = "লোকেশন খোঁজা হচ্ছে...";
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        localStorage.setItem('userLat', lat);
        localStorage.setItem('userLng', lng);
        
        // রিভার্স জিওকোডিং (শহরের নাম বের করা)
        getCityName(lat, lng);
        fetchPrayerTimes(lat, lng);
      },
      (error) => {
        console.warn("Location permission denied, using default:", error);
        if (locEl) locEl.innerText = DEFAULT_CITY;
        fetchPrayerTimes(DEFAULT_LAT, DEFAULT_LNG);
      },
      { timeout: 8000, enableHighAccuracy: false } // ফাস্ট রেসপন্সের জন্য
    );
  } else {
    if (locEl) locEl.innerText = DEFAULT_CITY;
    fetchPrayerTimes(DEFAULT_LAT, DEFAULT_LNG);
  }
}

// শহরের নাম বের করার দ্রুত ফাংশন
async function getCityName(lat, lng) {
  const locEl = document.getElementById('locationText');
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=bn`);
    const data = await res.json();
    const city = data.city || data.locality || data.principalSubdivision || DEFAULT_CITY;
    if (locEl) locEl.innerText = city;
    localStorage.setItem('userCity', city);
  } catch (e) {
    if (locEl) locEl.innerText = DEFAULT_CITY;
  }
}

/* -------------------------------------------------------
   ৩. নামাজের সময় ফেচিং (Aladhan High Speed API)
--------------------------------------------------------- */
async function fetchPrayerTimes(lat, lng) {
  const madhab = localStorage.getItem('islamicMadhab') || "1";
  const today = new Date();
  const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const cacheKey = `prayer_${dateStr}_${madhab}_${lat.toFixed(2)}_${lng.toFixed(2)}`;

  // ১. লোকাল ক্যাশ থেকে ইনস্ট্যান্ট লোড (Super Fast)
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    renderTimes(JSON.parse(cachedData));
    return;
  }

  // ২. API কল (Method 1 = Karachi/Subcontinent Standard, School 1 = Hanafi, 0 = Shafi)
  const apiUrl = `https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${lat}&longitude=${lng}&method=1&school=${madhab}`;

  try {
    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.code === 200 && result.data && result.data.timings) {
      const timings = result.data.timings;
      localStorage.setItem(cacheKey, JSON.stringify(timings));
      renderTimes(timings);
    } else {
      throw new Error("Invalid API response");
    }
  } catch (error) {
    console.error("Prayer time fetch failed:", error);
    const listEl = document.getElementById('prayerList');
    if (listEl) listEl.innerHTML = `<p style="color:red; text-align:center;">নামাজের সময় লোড করা যায়নি। ইন্টারনেট সংযোগ চেক করুন।</p>`;
  }
}

/* -------------------------------------------------------
   ৪. DOM-এ নামাজের ওয়াক্ত রেন্ডার করা
--------------------------------------------------------- */
function renderTimes(timings) {
  prayerTimesToday = timings;

  const prayerSchedule = [
    { key: "Fajr", name: "ফজর", icon: "🌅" },
    { key: "Sunrise", name: "সূর্যোদয় (সাহরি শেষ)", icon: "🌄" },
    { key: "Dhuhr", name: "যোহর", icon: "☀️" },
    { key: "Asr", name: "আসর", icon: "🌇" },
    { key: "Sunset", name: "সূর্যাস্ত (ইফতার)", icon: "🌇" },
    { key: "Maghrib", name: "মাগরিব", icon: "🌙" },
    { key: "Isha", name: "ইশা", icon: "🌌" }
  ];

  const listEl = document.getElementById('prayerList');
  if (listEl) {
    listEl.innerHTML = '';
    
    prayerSchedule.forEach(item => {
      const timeFormatted = format12Hour(timings[item.key]);
      const card = document.createElement('div');
      card.className = 'prayer-time-item';
      card.id = `prayer-item-${item.key.toLowerCase()}`;
      
      card.innerHTML = `
        <div class="name">${item.icon} ${item.name}</div>
        <div class="time">${timeFormatted}</div>
      `;
      listEl.appendChild(card);
    });
  }

  // লাইভ কাউন্টডাউন শুরু
  startLivePrayerTracker();
}

/* -------------------------------------------------------
   ৫. লাইভ কাউন্টডাউন ও ওয়াক্ত হাইলাইটার
--------------------------------------------------------- */
function startLivePrayerTracker() {
  if (countdownInterval) clearInterval(countdownInterval);

  function updateTracker() {
    if (!prayerTimesToday) return;

    const now = new Date();
    
    // ওয়াক্তগুলোর সঠিক Date অবজেক্ট তৈরি
    const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const prayerNamesBn = {
      Fajr: "ফজর",
      Sunrise: "নিষিদ্ধ সময় (সূর্যোদয়)",
      Dhuhr: "যোহর",
      Asr: "আসর",
      Maghrib: "মাগরিব",
      Isha: "ইশা"
    };

    let currentWaqt = "ইশা";
    let nextWaqt = "Fajr";
    let nextWaqtTime = null;

    for (let i = 0; i < prayerOrder.length; i++) {
      const key = prayerOrder[i];
      const [h, m] = prayerTimesToday[key].split(' ')[0].split(':').map(Number);
      const waqtDate = new Date();
      waqtDate.setHours(h, m, 0, 0);

      if (now < waqtDate) {
        nextWaqt = key;
        nextWaqtTime = waqtDate;
        currentWaqt = i === 0 ? "ইশা" : prayerNamesBn[prayerOrder[i - 1]];
        break;
      }
    }

    // যদি রাতের সময় হয় (ইশার পর) তবে পরবর্তী ওয়াক্ত আগামীকালের ফজর
    if (!nextWaqtTime) {
      nextWaqt = "Fajr";
      currentWaqt = "ইশা";
      const [h, m] = prayerTimesToday["Fajr"].split(' ')[0].split(':').map(Number);
      nextWaqtTime = new Date();
      nextWaqtTime.setDate(nextWaqtTime.getDate() + 1);
      nextWaqtTime.setHours(h, m, 0, 0);
    }

    // DOM আপডেট
    const curEl = document.getElementById('currentPrayer');
    const nextEl = document.getElementById('nextPrayer');
    const countEl = document.getElementById('countdown');

    if (curEl) curEl.innerHTML = `বর্তমান ওয়াক্ত: <strong style="color:var(--primary);">${currentWaqt}</strong>`;
    if (nextEl) nextEl.innerHTML = `পরবর্তী নামাজ: <strong>${prayerNamesBn[nextWaqt]}</strong> (${format12Hour(prayerTimesToday[nextWaqt])})`;

    // কাউন্টডাউন হিসাব
    const diffMs = nextWaqtTime - now;
    if (diffMs > 0) {
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = diffHrs > 0 ? `${toBnNum(diffHrs)} ঘণ্টা ` : '';
      const mStr = `${toBnNum(diffMins)} মিনিট `;
      const sStr = `${toBnNum(diffSecs)} সেকেন্ড`;

      if (countEl) countEl.innerText = `- ${hStr}${mStr}${sStr}`;
    }

    // অ্যাক্টিভ ওয়াক্ত কার্ড হাইলাইট
    document.querySelectorAll('.prayer-time-item').forEach(el => el.classList.remove('active'));
    const activeCard = document.getElementById(`prayer-item-${nextWaqt.toLowerCase()}`);
    if (activeCard) activeCard.classList.add('active');
  }

  updateTracker();
  countdownInterval = setInterval(updateTracker, 1000);
}

/* -------------------------------------------------------
   ৬. মাযহাব পরিবর্তনের হ্যান্ডলার
--------------------------------------------------------- */
function changeMadhab() {
  const madhabSelect = document.getElementById('madhabSelect');
  if (!madhabSelect) return;

  const selectedValue = madhabSelect.value;
  localStorage.setItem('islamicMadhab', selectedValue);

  // ক্যাশ ক্লিয়ার করে নতুন ডাটা ফেচ
  const lat = parseFloat(localStorage.getItem('userLat')) || DEFAULT_LAT;
  const lng = parseFloat(localStorage.getItem('userLng')) || DEFAULT_LNG;
  
  fetchPrayerTimes(lat, lng);
                                }
      
