/* =======================================================
   🌙 ISLAMIC & BENGALI CALENDAR SYSTEM
========================================================= */

// ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর
function toBnNum(n) {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return n.toString().replace(/\d/g, d => bn[d]);
}

// বাংলা মাসের হিসাব ক্যালকুলেটর (পশ্চিমবঙ্গ ও বাংলাদেশ স্ট্যান্ডার্ড)
function getBengaliDate(date) {
  const banglaMonths = [
    "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
    "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
  ];
  
  const d = date.getDate();
  const m = date.getMonth(); // 0 - 11
  const y = date.getFullYear();

  // বাংলা পঞ্জিকা সমন্বয়
  let bDay, bMonthIndex, bYear;
  bYear = (m < 3 || (m === 3 && d < 14)) ? y - 594 : y - 593;

  const startDay = [14, 15, 15, 16, 16, 16, 17, 16, 15, 14, 13, 14];
  const daysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];

  if (d >= startDay[m]) {
    bDay = d - startDay[m] + 1;
    bMonthIndex = (m + 8) % 12;
  } else {
    let prevM = (m - 1 + 12) % 12;
    bDay = daysInMonth[prevM] - (startDay[m] - d - 1);
    bMonthIndex = (m + 7) % 12;
  }

  return `${toBnNum(bDay)} ${banglaMonths[bMonthIndex]}, ${toBnNum(bYear)}`;
}

// হিজরী ক্যালেন্ডার ম্যানেজার
let viewDate = new Date();

function initIslamicCalendar() {
  const today = new Date();
  
  // ১. ইন্টেলিজেন্ট হিজরী ফরম্যাটার (Intl API)
  const hijriFormatter = new Intl.DateTimeFormat('bn-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hijriParts = hijriFormatter.formatToParts(today);
  let hDay = '', hMonth = '', hYear = '';

  hijriParts.forEach(p => {
    if (p.type === 'day') hDay = p.value;
    if (p.type === 'month') hMonth = p.value;
    if (p.type === 'year') hYear = p.value;
  });

  // মিনি কার্ডে ডাটা বসানো
  const elHDay = document.getElementById('hijriDay');
  const elHMonth = document.getElementById('hijriMonth');
  const elHYear = document.getElementById('hijriYear');
  const elGreg = document.getElementById('gregorianDate');
  const elBen = document.getElementById('bengaliDate');

  if (elHDay) elHDay.innerText = hDay;
  if (elHMonth) elHMonth.innerText = hMonth;
  if (elHYear) elHYear.innerText = `${hYear} হিজরি`;

  // ইংরেজি ও বাংলা তারিখ
  const engMonthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  if (elGreg) {
    elGreg.innerText = `${toBnNum(today.getDate())} ${engMonthsBn[today.getMonth()]}, ${toBnNum(today.getFullYear())}`;
  }
  if (elBen) {
    elBen.innerText = getBengaliDate(today);
  }

  // ২. মডাল ক্যালেন্ডার লজিক
  setupModalEvents();
}

function renderMonthGrid(targetDate) {
  const grid = document.getElementById('calDaysGrid');
  const modalTitle = document.getElementById('modalHijriMonth');
  const modalSubTitle = document.getElementById('modalSubTitle');
  if (!grid) return;

  grid.innerHTML = '';

  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  
  const firstDayIndex = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();
  const today = new Date();

  // ইন্টেল ফরম্যাটার দিয়ে হিজরী মাস নাম
  const hijriMonthFmt = new Intl.DateTimeFormat('bn-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' });
  const engMonthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  
  modalTitle.innerText = hijriMonthFmt.format(new Date(y, m, 15));
  modalSubTitle.innerText = `${engMonthsBn[m]} ${toBnNum(y)}`;

  // ফাঁকা সেল (মাসের শুরুর দিন অনুযায়ী)
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-cell empty';
    grid.appendChild(emptyCell);
  }

  // দিনের সেল তৈরি
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(y, m, day);
    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    // হিজরী তারিখ বের করা
    const hDayFmt = new Intl.DateTimeFormat('bn-u-ca-islamic-umalqura', { day: 'numeric' });
    const hDayVal = hDayFmt.format(cellDate);

    if (
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear()
    ) {
      cell.classList.add('today');
    }

    cell.innerHTML = `
      <span>${hDayVal}</span>
      <span class="eng-sub">${toBnNum(day)}</span>
    `;

    grid.appendChild(cell);
  }
}

function setupModalEvents() {
  const cardBtn = document.getElementById('openCalendarBtn');
  const modal = document.getElementById('calModalOverlay');
  const closeBtn = document.getElementById('closeCalModalBtn');
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');

  if (!cardBtn || !modal) return;

  // ওপেন মডাল
  cardBtn.addEventListener('click', () => {
    viewDate = new Date();
    renderMonthGrid(viewDate);
    modal.classList.add('active');
  });

  // ক্লোজ মডাল
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // নেভিগেশন (আগের ও পরের মাস)
  prevBtn.addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderMonthGrid(viewDate);
  });

  nextBtn.addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderMonthGrid(viewDate);
  });
}

// DOM লোড হলে চালু করুন
document.addEventListener('DOMContentLoaded', initIslamicCalendar);
                            
