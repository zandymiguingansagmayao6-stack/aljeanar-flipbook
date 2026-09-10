/**
 * FlipBook App — app.js
 * Converts a PDF into an interactive two-page spread viewer.
 */

'use strict';

// ── PDF.js worker ────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── State ────────────────────────────────────────────────────
let pdfDoc       = null;
let totalPages   = 0;
let currentSpread = 0;   // 0-indexed spread (2 pages per spread)
let scale        = 1.3;
const pageCache  = {};   // cache pdf page objects
const thumbCache = {};   // cache thumbnail canvases

// ── DOM refs ─────────────────────────────────────────────────
const uploadScreen  = document.getElementById('upload-screen');
const viewerScreen  = document.getElementById('viewer-screen');
const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const loadingWrap   = document.getElementById('loading-wrap');
const progressFill  = document.getElementById('progress-fill');
const loadingText   = document.getElementById('loading-text');
const thumbsBar     = document.getElementById('thumbs-bar');
const canvasL       = document.getElementById('canvas-left');
const canvasR       = document.getElementById('canvas-right');
const leftSide      = document.getElementById('left-side');
const rightSide     = document.getElementById('right-side');
const pageInfo      = document.getElementById('page-info');
const btnPrev       = document.getElementById('btn-prev');
const btnNext       = document.getElementById('btn-next');
const fileNameEl    = document.getElementById('file-name');

// ── Drag & Drop ───────────────────────────────────────────────
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
  else alert('Please drop a valid PDF file.');
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadPDF(fileInput.files[0]);
});

// ── Load PDF ─────────────────────────────────────────────────
async function loadPDF(file) {
  showLoading(true, 'Reading PDF…', 5);
  fileNameEl.textContent = file.name;

  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    totalPages   = pdfDoc.numPages;
    currentSpread = 0;

    thumbsBar.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const pct = Math.round((i / totalPages) * 80) + 10;
      showLoading(true, `Rendering page ${i} of ${totalPages}…`, pct);
      await renderThumb(i);
    }

    showLoading(true, 'Almost ready…', 98);
    await renderSpread();

    showLoading(false);
    switchScreen('viewer');

  } catch (err) {
    showLoading(false);
    alert('Could not read the PDF. Please try another file.');
    console.error(err);
  }
}

// ── Get (cached) PDF page ─────────────────────────────────────
async function getPage(n) {
  if (!pageCache[n]) pageCache[n] = await pdfDoc.getPage(n);
  return pageCache[n];
}

// ── Render a page onto a canvas ───────────────────────────────
async function renderPageToCanvas(canvas, pageNum) {
  if (pageNum < 1 || pageNum > totalPages) {
    canvas.parentElement.style.visibility = 'hidden';
    return;
  }
  canvas.parentElement.style.visibility = 'visible';

  const page     = await getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width  = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width  = viewport.width  + 'px';
  canvas.style.height = viewport.height + 'px';

  await page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
  }).promise;
}

// ── Render thumbnail ──────────────────────────────────────────
async function renderThumb(n) {
  const page     = await getPage(n);
  const viewport = page.getViewport({ scale: 0.18 });

  const c = document.createElement('canvas');
  c.width  = viewport.width;
  c.height = viewport.height;
  await page.render({ canvasContext: c.getContext('2d'), viewport }).promise;
  thumbCache[n] = c;

  const wrap = document.createElement('div');
  wrap.className  = 'thumb';
  wrap.id         = 'thumb-' + n;
  wrap.title      = 'Page ' + n;
  wrap.appendChild(c.cloneNode(true));

  const num = document.createElement('div');
  num.className   = 'thumb-num';
  num.textContent = n;
  wrap.appendChild(num);

  wrap.addEventListener('click', () => goToPage(n));
  thumbsBar.appendChild(wrap);
}

// ── Render current spread (left + right page) ─────────────────
async function renderSpread() {
  const lp = currentSpread * 2 + 1;
  const rp = lp + 1;

  await Promise.all([
    renderPageToCanvas(canvasL, lp),
    renderPageToCanvas(canvasR, rp),
  ]);

  // Hide right page if it doesn't exist
  rightSide.style.display = rp > totalPages ? 'none' : 'block';

  // Update toolbar
  if (rp <= totalPages) {
    pageInfo.textContent = `Pages ${lp}–${rp} of ${totalPages}`;
  } else {
    pageInfo.textContent = `Page ${lp} of ${totalPages}`;
  }

  const maxSpread = Math.ceil(totalPages / 2) - 1;
  btnPrev.disabled = currentSpread === 0;
  btnNext.disabled = currentSpread >= maxSpread;

  // Highlight active thumbnail
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  const activeThumb = document.getElementById('thumb-' + lp);
  if (activeThumb) {
    activeThumb.classList.add('active');
    activeThumb.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

// ── Navigation ────────────────────────────────────────────────
function goPage(direction) {
  const maxSpread = Math.ceil(totalPages / 2) - 1;
  currentSpread = Math.max(0, Math.min(maxSpread, currentSpread + direction));
  renderSpread();
}

function goToPage(n) {
  currentSpread = Math.floor((n - 1) / 2);
  renderSpread();
}

// ── Zoom ──────────────────────────────────────────────────────
function zoomIn()  { scale = Math.min(3.0, scale + 0.2); renderSpread(); }
function zoomOut() { scale = Math.max(0.5, scale - 0.2); renderSpread(); }

// ── Keyboard navigation ───────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!pdfDoc) return;
  if (e.key === 'ArrowRight') goPage(1);
  if (e.key === 'ArrowLeft')  goPage(-1);
  if (e.key === '+' || e.key === '=') zoomIn();
  if (e.key === '-') zoomOut();
});

// ── Reset ─────────────────────────────────────────────────────
function resetApp() {
  pdfDoc        = null;
  totalPages    = 0;
  currentSpread = 0;
  scale         = 1.3;

  Object.keys(pageCache).forEach(k  => delete pageCache[k]);
  Object.keys(thumbCache).forEach(k => delete thumbCache[k]);

  thumbsBar.innerHTML = '';
  fileInput.value     = '';
  fileNameEl.textContent = '';

  switchScreen('upload');
}

// ── UI helpers ────────────────────────────────────────────────
function switchScreen(name) {
  uploadScreen.classList.toggle('active', name === 'upload');
  viewerScreen.classList.toggle('active', name === 'viewer');
}

function showLoading(visible, message = '', percent = 0) {
  loadingWrap.classList.toggle('hidden', !visible);
  if (visible) {
    loadingText.textContent  = message;
    progressFill.style.width = percent + '%';
  }
}
