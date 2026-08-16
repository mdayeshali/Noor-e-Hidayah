/* =======================================================
   🌙 ISLAMIC & BENGALI CALENDAR SYSTEM (UPDATED)
========================================================= */

// ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর
function toBnNum(n) {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return n.toString().replace(/\d/g, d => bn[d]);
}

// হিজরি ১২টি মাসের বিশুদ্ধ বাংলা নাম
const hijriMonthsBn = [
  "মুহাররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি",
  "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান",
  "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"
];

// হিজরী তারিখ কনভার্টার
function getHijriData(date) {
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
    
    const parts = fmt.formatToParts(date);
    let hDay = 1, hMonth = 1, hYear = 1448;

    parts.forEach(p => {
      if (p.type === 'day') hDay = parseInt(p.value, 10);
      if (p.type === 'month') hMonth = parseInt(p.value, 10);
      if (p.type === 'year') hYear = parseInt(p.value.replace(/[^0-9]/g, ''), 10);
    });

    return {
      day: toBnNum(hDay),
      monthName: hijriMonthsBn[hMonth - 1] || "রবিউল আউয়াল",
      year: toBnNum(hYear)
    };
  } catch (e) {
    return { day: "৩", monthName: "রবিউল আউয়াল", year: "১৪৪৮" };
  }
}

// বাংলা মাসের হিসাব
function getBengaliDate(date) {
  const banglaMonths = [
    "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
    "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
  ];
  
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();

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

let viewDate = new Date();

function initIslamicCalendar() {
  const today = new Date();
  const hijri = getHijriData(today);

  // মিনি কার্ডে ডাটা বসানো
  const elHDay = document.getElementById('hijriDay');
  const elHMonth = document.getElementById('hijriMonth');
  const elHYear = document.getElementById('hijriYear');
  const elGreg = document.getElementById('gregorianDate');
  const elBen = document.getElementById('bengaliDate');

  if (elHDay) elHDay.innerText = hijri.day;
  if (elHMonth) elHMonth.innerText = hijri.monthName;
  if (elHYear) elHYear.innerText = `${hijri.year} হিজরি`;

  // ইংরেজি ও বাংলা তারিখ
  const engMonthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  if (elGreg) {
    elGreg.innerText = `${toBnNum(today.getDate())} ${engMonthsBn[today.getMonth()]}, ${toBnNum(today.getFullYear())}`;
  }
  if (elBen) {
    elBen.innerText = getBengaliDate(today);
  }

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

  // মাসের মাঝামাঝি তারিখ ধরে হিজরী মাস বের করা
  const midDateHijri = getHijriData(new Date(y, m, 15));
  const engMonthsBn = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
  
  if (modalTitle) modalTitle.innerText = `${midDateHijri.monthName} ${midDateHijri.year} হিজরি`;
  if (modalSubTitle) modalSubTitle.innerText = `${engMonthsBn[m]} ${toBnNum(y)}`;

  // ফাঁকা সেল
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

    const cellHijri = getHijriData(cellDate);

    if (
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear()
    ) {
      cell.classList.add('today');
    }

    cell.innerHTML = `
      <span>${cellHijri.day}</span>
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

  cardBtn.addEventListener('click', () => {
    viewDate = new Date();
    renderMonthGrid(viewDate);
    modal.classList.add('active');
  });

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      renderMonthGrid(viewDate);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      renderMonthGrid(viewDate);
    });
  }
}

// লোড কল
document.addEventListener('DOMContentLoaded', initIslamicCalendar);
