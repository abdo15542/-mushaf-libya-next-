
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const app = document.querySelector('#app');

app.innerHTML = `
  <header>
    <div class="brand">مصحف ليبيا</div>
    <div class="subtitle">المصحف التفاعلي — رواية قالون</div>
    <button id="themeToggle" type="button">الوضع الليلي / النهاري</button>
  </header>

  <main>
    <section class="toolbar">
      <button id="prev">الصفحة السابقة</button>
      <label>رقم الصفحة
        <input id="page" type="number" min="1" value="1">
      </label>
      <button id="go">انتقال</button>
      <button id="next">الصفحة التالية</button>
      <button id="bookmark">حفظ العلامة</button>
    </section>

    <p id="status" role="status">جارٍ تحميل المصحف…</p>

    <section class="reader">
      <canvas id="pageCanvas" aria-label="صفحة المصحف"></canvas>
    </section>

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
  </main>
`;

const $ = selector => document.querySelector(selector);
const canvas = $('#pageCanvas');
const ctx = canvas.getContext('2d');
const pageInput = $('#page');
const status = $('#status');

let pdf = null;
let pageNumber = Number(localStorage.getItem('mushaf-page') || 1);
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
$('#prev').addEventListener('click', () => renderPage(pageNumber - 1));
$('#next').addEventListener('click', () => renderPage(pageNumber + 1));

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
    ? items.filter(item => Number.isInteger(item.page))
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
    open.textContent = `الصفحة ${item.page}`;
    open.addEventListener('click', () => renderPage(item.page));

    const remove = document.createElement('button');
    remove.textContent = 'حذف';
    remove.className = 'secondary';
    remove.addEventListener('click', () => {
      const remaining = getBookmarks().filter(x => x.page !== item.page);
      localStorage.setItem('mushaf-bookmarks', JSON.stringify(remaining));
      drawBookmarks();
    });

    li.append(open, remove);
    list.append(li);
  });
}

$('#bookmark').addEventListener('click', () => {
  const items = getBookmarks();

  if (!items.some(item => item.page === pageNumber)) {
    items.push({ page: pageNumber });
    localStorage.setItem('mushaf-bookmarks', JSON.stringify(items));
  }

  drawBookmarks();
  status.textContent = `تم حفظ الصفحة ${pageNumber}`;
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
