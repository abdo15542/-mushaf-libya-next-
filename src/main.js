
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';
import { surahNames } from './surah-index.js';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="app-header">
    <div class="brand-mark" aria-hidden="true">۞</div>
    <div class="brand">مصحف ليبيا</div>
    <div class="subtitle">المصحف التفاعلي · رواية قالون عن نافع</div>
    <button id="themeToggle" type="button" aria-label="تغيير المظهر">☼ المظهر</button>
  </header>

  <nav class="bottom-nav" aria-label="التنقل الرئيسي">
    <button type="button" data-view="homeView" class="nav-item active">⌂<span>الرئيسية</span></button>
    <button type="button" data-view="readerView" class="nav-item">▤<span>المصحف</span></button>
    <button type="button" data-view="audioView" class="nav-item">♫<span>التلاوة</span></button>
    <button type="button" data-view="dhikrView" class="nav-item">۞<span>الأذكار</span></button>
    <button type="button" data-view="toolsView" class="nav-item">☰<span>الأدوات</span></button>
  </nav>

  <main>
    <section id="homeView" class="home-view">
      <div class="welcome-card">
        <div class="welcome-eyebrow">رفيقك اليومي مع القرآن الكريم</div>
        <h1>السلام عليكم ورحمة الله</h1>
        <p>اجعل لك مع القرآن وردًا كل يوم.</p>
        <button type="button" data-open-view="readerView" class="gold-button">متابعة القراءة ←</button>
      </div>

      <div class="section-heading">
        <div><h2>متابعة القراءة</h2><p>ارجع إلى موضعك الأخير</p></div>
        <span class="ornament">۞</span>
      </div>
      <button type="button" id="continueReading" class="continue-card">
        <span class="book-icon">▤</span>
        <span class="continue-copy"><strong>المصحف الشريف</strong><small id="lastPageLabel">الصفحة الأخيرة المحفوظة</small></span>
        <span class="continue-arrow">←</span>
      </button>

      <div class="section-heading"><div><h2>الوصول السريع</h2><p>كل ما تحتاجه في مكان واحد</p></div></div>
      <div class="quick-grid">
        <button type="button" data-open-view="readerView" class="quick-card"><span class="quick-icon">📖</span><strong>قراءة المصحف</strong><small>تابع وردك اليومي</small></button>
        <button type="button" data-open-view="audioView" class="quick-card"><span class="quick-icon">♫</span><strong>الاستماع</strong><small>الدوكالي · قالون</small></button>
        <button type="button" data-open-view="dhikrView" class="quick-card"><span class="quick-icon">۞</span><strong>الأذكار والتسبيح</strong><small>اذكر الله في كل وقت</small></button>
        <button type="button" data-open-view="toolsView" class="quick-card"><span class="quick-icon">⌕</span><strong>البحث والعلامات</strong><small>اعثر على موضعك سريعًا</small></button>
      </div>
      <div class="daily-note"><span>✦</span><div><strong>بالقرآن تحيا القلوب</strong><p>اقرأ بتدبر، ولو آيات قليلة كل يوم.</p></div></div>
    </section>
    <section id="readerView" class="app-view">
    <section class="toolbar">
      <button id="firstPage" type="button">أول المصحف</button>
      <button id="prev">الصفحة السابقة</button>
      <label>رقم الصفحة
        <input id="page" type="number" min="1" value="1">
      </label>
      <button id="go">انتقال</button>
      <button id="next">الصفحة التالية</button>
      <button id="lastPage" type="button">آخر المصحف</button>
      <button id="bookmark">حفظ العلامة</button>
    </section>

    <button id="toggleSurahIndex" type="button">📖 فهرس السور</button>
    <section id="surahIndexPanel" hidden>
      <h2>فهرس السور</h2>
      <label for="surahSearch">ابحث عن سورة</label>
      <input id="surahSearch" type="search" placeholder="اسم السورة">
      <label for="surahSelect">اختر السورة</label>
      <select id="surahSelect"></select>
      <label for="surahPage">صفحة بداية السورة</label>
      <input id="surahPage" type="number" min="1" max="627" placeholder="رقم الصفحة بعد التحقق">
      <button id="saveSurahPage" type="button">حفظ بداية السورة</button>
      <button id="openSurahPage" type="button">الانتقال إلى الصفحة المحفوظة</button>
      <p id="surahIndexStatus" role="status"></p>
      <ul id="surahSavedList"></ul>
    </section>
    <p id="status" role="status">جارٍ تحميل المصحف…</p>

    <section class="reader">
      <canvas id="pageCanvas" aria-label="صفحة المصحف"></canvas>
    </section>

    </section>

    <section id="toolsView" class="app-view">
    <section class="tools">
      <h2>العلامات المرجعية</h2>
      <ul id="bookmarks"></ul>

      <h2>البحث في صفحات المصحف</h2>
      <p>يبحث في النص الموجود داخل ملف PDF، وقد لا يعمل إذا كانت الصفحات صورًا بلا نص قابل للاستخراج.</p>
      <form id="searchForm">
        <input id="searchInput" type="search" placeholder="اكتب كلمة للبحث">
        <button type="submit">بحث</button>
      </form>
      <p id="searchStatus" role="status"></p>
      <ol id="searchResults"></ol>
    </section>

    </section>

    <section id="dhikrView" class="app-view">
    <section class="tools">
      <h2>الأذكار والتسبيح</h2>
      <p id="dhikrText" class="dhikr-text">سُبْحَانَ اللَّهِ</p>
      <p>عدد التسبيحات: <strong id="counter">0</strong></p>
      <div class="toolbar">
        <button id="countDhikr">سبّح</button>
        <button id="resetDhikr">تصفير العداد</button>
        <button id="nextDhikr">الذكر التالي</button>
      </div>
    </section>

    </section>

    <section id="audioView" class="app-view">
    <section class="tools audio-tools" aria-labelledby="audioHeading">
      <h2 id="audioHeading">استماع الدوكالي — رواية قالون</h2>
      <p>الشيخ الدوكالي محمد العالم · قالون عن نافع</p>

      <label for="audioSurah">اختر السورة</label>
      <select id="audioSurah"></select>

      <audio id="quranAudio" controls preload="none">
        متصفحك لا يدعم تشغيل الصوت.
      </audio>

      <div class="audio-actions">
        <button id="streamAudio" type="button">استماع عبر الإنترنت</button>
        <button id="downloadAudio" type="button">تنزيل السورة للاستماع دون إنترنت</button>
        <button id="playSavedAudio" type="button">تشغيل النسخة المحفوظة</button>
        <button id="deleteSavedAudio" type="button">حذف النسخة المحفوظة</button>
      </div>

      <p id="audioStatus" role="status" aria-live="polite">
        اختر سورة للاستماع أو تنزيلها.
      </p>
      <p id="audioStorageInfo" class="audio-muted"></p>
    </section>
    </section>

  </main>
`;


const $ = selector => document.querySelector(selector);

// التنقل بين واجهات التطبيق مع إبقاء أقسامه ووظائفه في الصفحة نفسها.
function showView(viewId) {
  const target = document.getElementById(viewId);
  if (!target) return;

  document.querySelectorAll('.app-view, .home-view').forEach(view => {
    view.hidden = view.id !== viewId;
  });

  document.querySelectorAll('.nav-item').forEach(button => {
    const active = button.dataset.view === viewId;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (viewId === 'readerView' && typeof renderPage === 'function') {
    // العرض الطبيعي يستمر عبر آلية تحميل المصحف الحالية.
  }
}

document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', () => showView(button.dataset.view));
});
document.querySelectorAll('[data-open-view]').forEach(button => {
  button.addEventListener('click', () => showView(button.dataset.openView));
});
document.getElementById('continueReading')?.addEventListener('click', () => {
  showView('readerView');
});

showView('homeView');

const canvas = $('#pageCanvas');
const ctx = canvas.getContext('2d');
const pageInput = $('#page');
const status = $('#status');

let pdf = null;
let pageNumber = Number(localStorage.getItem('mushaf-page') || 1);
const lastPageLabel = document.getElementById('lastPageLabel');
if (lastPageLabel) lastPageLabel.textContent = `آخر موضع محفوظ: الصفحة ${pageNumber}`;
let rendering = false;
let pendingPage = null;
let searchIndex = null;
let indexing = false;

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeArabic(value) {
  return value
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function renderPage(number) {
  if (!pdf) return;

  const target = Math.max(1, Math.min(pdf.numPages, Number(number) || 1));

  if (rendering) {
    pendingPage = target;
    return;
  }

  rendering = true;

  try {
    pageNumber = target;
    status.textContent = 'جارٍ عرض الصفحة…';

    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const maxWidth = Math.min(window.innerWidth - 36, 850);
    const scale = Math.max(0.5, Math.min(2, maxWidth / base.width));
    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    await page.render({
      canvasContext: ctx,
      viewport,
      transform: outputScale !== 1
        ? [outputScale, 0, 0, outputScale, 0, 0]
        : null
    }).promise;

    pageInput.value = pageNumber;
    pageInput.max = pdf.numPages;
    localStorage.setItem('mushaf-page', String(pageNumber));

    const lastPageLabel = document.getElementById('lastPageLabel');
    if (lastPageLabel) {
      lastPageLabel.textContent = `آخر موضع محفوظ: الصفحة ${pageNumber}`;
    }

    status.textContent = `الصفحة ${pageNumber} من ${pdf.numPages}`;
  } catch (error) {
    console.error(error);
    status.textContent = `تعذر عرض الصفحة: ${error.message || error}`;
  } finally {
    rendering = false;

    if (pendingPage !== null) {
      const next = pendingPage;
      pendingPage = null;
      renderPage(next);
    }
  }
}

// التنقل بين الصفحات
$('#firstPage').addEventListener('click', () => renderPage(1));
$('#prev').addEventListener('click', () => renderPage(pageNumber - 1));
$('#next').addEventListener('click', () => renderPage(pageNumber + 1));
$('#lastPage').addEventListener('click', () => {
  if (pdf) renderPage(pdf.numPages);
});

$('#go').addEventListener('click', () => {
  const value = Number(pageInput.value);
  if (Number.isInteger(value)) renderPage(value);
});

pageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') $('#go').click();
});

// العلامات المرجعية المتعددة
function getBookmarks() {
  const items = readJSON('mushaf-bookmarks', []);
  return Array.isArray(items)
    ? items.filter(item =>
        item &&
        Number.isInteger(item.page) &&
        item.page >= 1 &&
        (!pdf || item.page <= pdf.numPages)
      )
    : [];
}

function drawBookmarks() {
  const list = $('#bookmarks');
  list.replaceChildren();

  const items = getBookmarks().sort((a, b) => a.page - b.page);

  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'لا توجد علامات محفوظة.';
    list.append(li);
    return;
  }

  items.forEach(item => {
    const li = document.createElement('li');
    const open = document.createElement('button');
    open.textContent = item.name
      ? `${item.name} — الصفحة ${item.page}`
      : `الصفحة ${item.page}`;
    open.addEventListener('click', () => renderPage(item.page));

    const rename = document.createElement('button');
    rename.textContent = 'تسمية';
    rename.className = 'secondary';
    rename.addEventListener('click', () => {
      const currentName = item.name || `صفحة ${item.page}`;
      const value = window.prompt('اكتب اسمًا لهذه العلامة:', currentName);
      if (value === null) return;

      const name = value.trim().slice(0, 80);
      const updated = getBookmarks().map(x =>
        x.page === item.page ? { ...x, name } : x
      );
      localStorage.setItem('mushaf-bookmarks', JSON.stringify(updated));
      drawBookmarks();
      status.textContent = name
        ? `تم تحديث اسم العلامة: ${name}`
        : `تمت إزالة اسم العلامة للصفحة ${item.page}.`;
    });

    const remove = document.createElement('button');
    remove.textContent = 'حذف';
    remove.className = 'secondary';
    remove.addEventListener('click', () => {
      const remaining = getBookmarks().filter(x => x.page !== item.page);
      localStorage.setItem('mushaf-bookmarks', JSON.stringify(remaining));
      drawBookmarks();
      status.textContent = `تم حذف علامة الصفحة ${item.page}.`;
    });

    li.append(open, rename, remove);
    list.append(li);
  });
}

$('#bookmark').addEventListener('click', () => {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 ||
      (pdf && pageNumber > pdf.numPages)) {
    status.textContent = 'تعذر حفظ العلامة: رقم الصفحة غير صحيح.';
    return;
  }

  const items = getBookmarks();
  const existing = items.find(item => item.page === pageNumber);

  if (existing) {
    const value = window.prompt(
      'هذه الصفحة محفوظة بالفعل. أدخل اسمًا للعلامة:',
      existing.name || `صفحة ${pageNumber}`
    );
    if (value === null) return;
    existing.name = value.trim().slice(0, 80);
    localStorage.setItem('mushaf-bookmarks', JSON.stringify(items));
    drawBookmarks();
    status.textContent = `تم تحديث علامة الصفحة ${pageNumber}.`;
    return;
  }

  const value = window.prompt(
    'يمكنك تسمية العلامة أو ترك الاسم الافتراضي:',
    `صفحة ${pageNumber}`
  );
  if (value === null) return;

  const name = value.trim().slice(0, 80);
  items.push({ page: pageNumber, name });
  localStorage.setItem('mushaf-bookmarks', JSON.stringify(items));
  drawBookmarks();
  status.textContent = `تم حفظ العلامة ${name || `للصفحة ${pageNumber}`}.`;
});

drawBookmarks();

// الوضع الليلي والنهاري
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('mushaf-theme', theme);
  $('#themeToggle').setAttribute(
    'aria-pressed',
    String(theme === 'light')
  );
}

applyTheme(localStorage.getItem('mushaf-theme') || 'dark');

$('#themeToggle').addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// الأذكار وعداد التسبيح
const adhkar = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'اللَّهُ أَكْبَرُ',
  'أَسْتَغْفِرُ اللَّهَ'
];

let dhikrIndex = 0;
let dhikrCount = Math.max(
  0,
  Number(localStorage.getItem('mushaf-dhikr-count') || 0)
);

function drawCounter() {
  $('#counter').textContent = String(dhikrCount);
  $('#dhikrText').textContent = adhkar[dhikrIndex];
}

$('#countDhikr').addEventListener('click', () => {
  dhikrCount++;
  localStorage.setItem('mushaf-dhikr-count', String(dhikrCount));
  drawCounter();
});

$('#resetDhikr').addEventListener('click', () => {
  dhikrCount = 0;
  localStorage.setItem('mushaf-dhikr-count', '0');
  drawCounter();
});

$('#nextDhikr').addEventListener('click', () => {
  dhikrIndex = (dhikrIndex + 1) % adhkar.length;
  drawCounter();
});

drawCounter();

// تجهيز فهرس البحث من النص الموجود داخل PDF
async function buildSearchIndex() {
  if (searchIndex) return searchIndex;

  if (indexing) {
    while (indexing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return searchIndex || [];
  }

  indexing = true;
  const entries = [];

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str || '').join(' ');

      entries.push({
        page: i,
        text,
        normalized: normalizeArabic(text)
      });

      if (i % 20 === 0 || i === pdf.numPages) {
        $('#searchStatus').textContent =
          `تجهيز البحث: ${i} من ${pdf.numPages} صفحة`;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    searchIndex = entries;
    return entries;
  } finally {
    indexing = false;
  }
}

$('#searchForm').addEventListener('submit', async event => {
  event.preventDefault();

  if (!pdf) {
    $('#searchStatus').textContent = 'انتظر تحميل المصحف أولًا.';
    return;
  }

  const query = normalizeArabic($('#searchInput').value);
  const results = $('#searchResults');
  results.replaceChildren();

  if (query.length < 2) {
    $('#searchStatus').textContent = 'اكتب حرفين على الأقل.';
    return;
  }

  try {
    const entries = await buildSearchIndex();
    const matches = entries
      .filter(entry => entry.normalized.includes(query))
      .slice(0, 50);

    if (!matches.length) {
      $('#searchStatus').textContent =
        'لا توجد نتائج. ربما لا يحتوي PDF على نص قابل للبحث.';
      return;
    }

    $('#searchStatus').textContent =
      `النتائج المعروضة: ${matches.length}`;

    matches.forEach(match => {
      const li = document.createElement('li');
      const button = document.createElement('button');

      button.className = 'result-button';
      button.textContent =
        `الصفحة ${match.page}: ${match.text.slice(0, 160) || 'نتيجة نصية'}`;

      button.addEventListener('click', () => {
        renderPage(match.page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      li.append(button);
      results.append(li);
    });
  } catch (error) {
    console.error(error);
    $('#searchStatus').textContent = 'تعذر البحث في نص ملف المصحف.';
  }
});

// تحميل المصحف
(async () => {
  try {
    status.textContent = 'جارٍ فتح ملف المصحف…';

    const response = await fetch('/assets/mushaf-qalun.pdf');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} عند تحميل المصحف`);
    }

    const data = new Uint8Array(await response.arrayBuffer());
    pdf = await pdfjs.getDocument({ data }).promise;
    await renderPage(pageNumber);
  } catch (error) {
    console.error(error);
    status.textContent = `فشل تحميل المصحف: ${error.message || error}`;
  }
})();

// تسجيل خدمة العمل دون اتصال
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(error => console.error('تعذر تسجيل الخدمة:', error));
  });
}


// مشغل الدوكالي: قالون عن نافع، مع حفظ السور المختارة محليًا.
(() => {
  const $audio = id => document.getElementById(id);
  const select = $audio('audioSurah');
  const player = $audio('quranAudio');
  const status = $audio('audioStatus');
  const downloadButton = $audio('downloadAudio');
  const savedButton = $audio('playSavedAudio');
  const deleteButton = $audio('deleteSavedAudio');

  if (!select || !player || !status) return;

  const surahs = [
    'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام',
    'الأعراف','الأنفال','التوبة','يونس','هود','يوسف','الرعد',
    'إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه',
    'الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء',
    'النمل','القصص','العنكبوت','الروم','لقمان','السجدة','الأحزاب',
    'سبأ','فاطر','يس','الصافات','ص','الزمر','غافر','فصلت',
    'الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد',
    'الفتح','الحجرات','ق','الذاريات','الطور','النجم','القمر',
    'الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة',
    'الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم',
    'الملك','القلم','الحاقة','المعارج','نوح','الجن','المزمل',
    'المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات',
    'عبس','التكوير','الانفطار','المطففين','الانشقاق','البروج',
    'الطارق','الأعلى','الغاشية','الفجر','البلد','الشمس','الليل',
    'الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة',
    'العاديات','القارعة','التكاثر','العصر','الهمزة','الفيل',
    'قريش','الماعون','الكوثر','الكافرون','النصر','المسد',
    'الإخلاص','الفلق','الناس'
  ];

  const server = 'https://cdn.mp3quran.net/audio/dokali-alim/r1/';
  const DB_NAME = 'mushaf-audio-v1';
  const STORE = 'tracks';
  let dbPromise;
  let currentObjectUrl = null;
  let busy = false;

  surahs.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = String(index + 1);
    option.textContent = `${index + 1}. سورة ${name}`;
    select.append(option);
  });

  function audioUrl(id) {
    return server + String(id).padStart(3, '0') + '.mp3';
  }

  function openDB() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('التخزين المحلي غير مدعوم في هذا المتصفح.'));
    }
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function getTrack(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly')
        .objectStore(STORE).get(Number(id));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveTrack(track) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(track);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('أُلغي الحفظ.'));
    });
  }

  async function removeTrack(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(Number(id));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function releaseObjectUrl() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  function selectedName() {
    return surahs[Number(select.value) - 1] || '';
  }

  async function refreshAudioButtons() {
    try {
      const track = await getTrack(select.value);
      savedButton.disabled = !track;
      deleteButton.disabled = !track;
      downloadButton.disabled = busy;
      if (track) {
        status.textContent = `السورة محفوظة على هذا الجهاز: ${selectedName()}.`;
      } else if (!busy) {
        status.textContent = `السورة غير محفوظة بعد: ${selectedName()}.`;
      }
    } catch (error) {
      savedButton.disabled = true;
      deleteButton.disabled = true;
      status.textContent = error.message || 'تعذر الوصول إلى التخزين المحلي.';
    }
  }

  select.addEventListener('change', () => {
    refreshAudioButtons();
  });

  $audio('streamAudio').addEventListener('click', async () => {
    releaseObjectUrl();
    player.src = audioUrl(select.value);
    player.load();
    status.textContent = `جارٍ تجهيز سورة ${selectedName()} عبر الإنترنت…`;
    try {
      await player.play();
      status.textContent = `تستمع الآن إلى سورة ${selectedName()}.`;
    } catch {
      status.textContent = 'اضغط زر التشغيل داخل مشغل الصوت لبدء التلاوة.';
    }
  });

  downloadButton.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    downloadButton.disabled = true;
    status.textContent = `جارٍ تنزيل سورة ${selectedName()}… لا تغلق التطبيق.`;

    try {
      const response = await fetch(audioUrl(select.value));
      if (!response.ok) throw new Error(`فشل التنزيل: HTTP ${response.status}`);

      const blob = await response.blob();
      if (!blob.size || (blob.type && !blob.type.includes('audio'))) {
        throw new Error('الملف المستلم ليس ملفًا صوتيًا صالحًا.');
      }

      await saveTrack({
        id: Number(select.value),
        name: selectedName(),
        blob,
        size: blob.size,
        savedAt: Date.now()
      });

      const mb = (blob.size / 1024 / 1024).toFixed(2);
      status.textContent = `تم حفظ سورة ${selectedName()} للاستماع دون إنترنت (${mb} ميغابايت).`;
    } catch (error) {
      console.error('Audio download failed:', error);
      status.textContent =
        'تعذر التنزيل أو الحفظ. تحقق من الإنترنت ومساحة الهاتف، ثم أعد المحاولة.';
    } finally {
      busy = false;
      downloadButton.disabled = false;
      await refreshAudioButtons();
    }
  });

  savedButton.addEventListener('click', async () => {
    try {
      const track = await getTrack(select.value);
      if (!track) {
        status.textContent = 'هذه السورة غير محفوظة. نزّلها أولًا أثناء الاتصال بالإنترنت.';
        return;
      }
      releaseObjectUrl();
      currentObjectUrl = URL.createObjectURL(track.blob);
      player.src = currentObjectUrl;
      player.load();
      status.textContent = `تشغيل سورة ${track.name} من النسخة المحفوظة على الجهاز.`;
      try {
        await player.play();
      } catch {
        status.textContent = 'النسخة محفوظة. اضغط زر التشغيل داخل مشغل الصوت.';
      }
    } catch (error) {
      status.textContent = error.message || 'تعذر تشغيل النسخة المحفوظة.';
    }
  });

  deleteButton.addEventListener('click', async () => {
    try {
      await removeTrack(select.value);
      if (currentObjectUrl) {
        player.pause();
        player.removeAttribute('src');
        player.load();
        releaseObjectUrl();
      }
      status.textContent = `حُذفت النسخة المحفوظة من سورة ${selectedName()}.`;
      await refreshAudioButtons();
    } catch (error) {
      status.textContent = error.message || 'تعذر حذف النسخة المحفوظة.';
    }
  });

  player.addEventListener('error', () => {
    status.textContent = 'تعذر تشغيل الصوت. تحقق من الاتصال أو أعد تنزيل السورة.';
  });

  window.addEventListener('pagehide', releaseObjectUrl);

  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(info => {
      const used = info.usage == null ? null : (info.usage / 1024 / 1024).toFixed(1);
      const quota = info.quota == null ? null : (info.quota / 1024 / 1024).toFixed(0);
      const el = $audio('audioStorageInfo');
      if (el && used !== null && quota !== null) {
        el.textContent = `استخدام التخزين التقريبي للتطبيق: ${used} من ${quota} ميغابايت.`;
      }
    }).catch(() => {});
  }

  refreshAudioButtons();
})();


// SURAH_INDEX_FEATURE
(() => {
  const panel = document.getElementById('surahIndexPanel');
  const toggle = document.getElementById('toggleSurahIndex');
  const search = document.getElementById('surahSearch');
  const select = document.getElementById('surahSelect');
  const pageInput = document.getElementById('surahPage');
  const saveButton = document.getElementById('saveSurahPage');
  const openButton = document.getElementById('openSurahPage');
  const message = document.getElementById('surahIndexStatus');
  const savedList = document.getElementById('surahSavedList');
  const storageKey = 'mushaf-surah-pages';

  if (!panel || !toggle || !search || !select || !pageInput ||
      !saveButton || !openButton || !message || !savedList) {
    console.warn('تعذر تهيئة فهرس السور: بعض عناصر الواجهة غير موجودة.');
    return;
  }

  const readSaved = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };

  const saved = readSaved();

  function fillSelect() {
    const query = (search.value || '').trim().replace(/\s+/g, ' ');
    const previous = select.value;
    const matches = surahNames
      .map((name, index) => ({ name, number: index + 1 }))
      .filter(item => item.name.includes(query));

    select.replaceChildren();
    for (const item of matches) {
      const option = document.createElement('option');
      option.value = String(item.number);
      option.textContent = `${item.number}. ${item.name}`;
      select.appendChild(option);
    }

    if (matches.some(item => String(item.number) === previous)) {
      select.value = previous;
    }
    updateSavedList();
  }

  function updateSavedList() {
    savedList.replaceChildren();
    surahNames.forEach((name, index) => {
      const page = Number(saved[String(index + 1)]);
      if (!Number.isInteger(page) || page < 1 || page > 627) return;

      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${name} — الصفحة ${page}`;
      button.addEventListener('click', () => {
        pageInput.value = String(page);
        select.value = String(index + 1);
        if (typeof renderPage === 'function') renderPage(page);
        message.textContent = `تم طلب الانتقال إلى صفحة ${page} من سورة ${name}.`;
      });
      item.appendChild(button);
      savedList.appendChild(item);
    });
  }

  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      fillSelect();
      message.textContent = 'اختر السورة وأدخل رقم صفحة بدايتها بعد التحقق من المصحف.';
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  search.addEventListener('input', fillSelect);
  select.addEventListener('change', () => {
    const page = Number(saved[select.value]);
    pageInput.value = Number.isInteger(page) ? String(page) : '';
    const name = surahNames[Number(select.value) - 1];
    message.textContent = name
      ? (page ? `الصفحة المحفوظة لسورة ${name}: ${page}` : `لم تحفظ صفحة بداية سورة ${name} بعد.`)
      : '';
  });

  saveButton.addEventListener('click', () => {
    const number = Number(select.value);
    const page = Number(pageInput.value);

    if (!Number.isInteger(number) || number < 1 || number > surahNames.length) {
      message.textContent = 'اختر سورة صحيحة أولًا.';
      return;
    }
    if (!Number.isInteger(page) || page < 1 || page > 627) {
      message.textContent = 'أدخل رقم صفحة صحيحًا من 1 إلى 627.';
      return;
    }

    saved[String(number)] = page;
    localStorage.setItem(storageKey, JSON.stringify(saved));
    updateSavedList();
    message.textContent = `حُفظت صفحة ${page} لسورة ${surahNames[number - 1]} على هذا الجهاز.`;
  });

  openButton.addEventListener('click', () => {
    const number = Number(select.value);
    const page = Number(saved[String(number)]);
    if (!Number.isInteger(page) || page < 1 || page > 627) {
      message.textContent = 'لا توجد صفحة محفوظة لهذه السورة. أدخل الصفحة الصحيحة واحفظها أولًا.';
      return;
    }
    if (typeof renderPage === 'function') {
      renderPage(page);
      message.textContent = `تم طلب الانتقال إلى الصفحة ${page} من سورة ${surahNames[number - 1]}.`;
    } else {
      message.textContent = 'ميزة عرض المصحف لم تجهز بعد.';
    }
  });

  fillSelect();
})();
