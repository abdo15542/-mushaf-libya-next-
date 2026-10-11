import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const app = document.querySelector('#app');

app.innerHTML = `
  <header>
    <div class="brand">مصحف ليبيا</div>
    <div class="subtitle">المصحف التفاعلي — رواية قالون</div>
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
      <h2>البحث في النص القرآني</h2>
      <p>قاعدة النص المطابقة لرواية قالون لم تُضف بعد.</p>
      <h2>العلامة المرجعية</h2>
      <p id="saved">لا توجد علامة محفوظة.</p>
    </section>
  </main>
`;

const canvas = document.querySelector('#pageCanvas');
const ctx = canvas.getContext('2d');
const pageInput = document.querySelector('#page');
const status = document.querySelector('#status');
const saved = document.querySelector('#saved');

let pdf = null;
let pageNumber = Number(localStorage.getItem('mushaf-page') || 1);
let rendering = false;
let pendingPage = null;

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
    console.error('PDF page rendering failed:', error);
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

document.querySelector('#prev').addEventListener('click', () => {
  renderPage(pageNumber - 1);
});

document.querySelector('#next').addEventListener('click', () => {
  renderPage(pageNumber + 1);
});

document.querySelector('#go').addEventListener('click', () => {
  const value = Number(pageInput.value);
  if (Number.isInteger(value)) renderPage(value);
});

document.querySelector('#bookmark').addEventListener('click', () => {
  localStorage.setItem('mushaf-bookmark', String(pageNumber));
  saved.textContent = `الصفحة المحفوظة: ${pageNumber}`;
});

const bookmark = localStorage.getItem('mushaf-bookmark');
if (bookmark) saved.textContent = `الصفحة المحفوظة: ${bookmark}`;

(async () => {
  try {
    status.textContent = 'جارٍ فتح ملف المصحف…';

    const response = await fetch('/assets/mushaf-qalun.pdf');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} عند تحميل المصحف`);
    }

    const data = new Uint8Array(await response.arrayBuffer());
    const task = pdfjs.getDocument({ data });
    pdf = await task.promise;

    await renderPage(pageNumber);
  } catch (error) {
    console.error('PDF loading failed:', error);
    status.textContent = `فشل تحميل المصحف: ${error.message || error}`;
  }
})();

// تسجيل خدمة العمل دون اتصال
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('تم تسجيل خدمة العمل دون اتصال'))
      .catch(error => console.error('تعذر تسجيل الخدمة:', error));
  });
}
