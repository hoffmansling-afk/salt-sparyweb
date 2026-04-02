// ============================================================
//   Salt & Spray -- Scroll Flipbook
//   192 frames mapped across 420vh of scroll travel
// ============================================================


// ── Config ──────────────────────────────────────────────────

const TOTAL_FRAMES    = 192;
const FRAME_PATH      = (n) => `frames/frame_${String(n + 1).padStart(4, '0')}.jpg`;
const VERTICAL_OFFSET = 16;   // px -- vertical nudge applied to every frame


// ── State ───────────────────────────────────────────────────

const images = new Array(TOTAL_FRAMES);
let loaded       = 0;
let currentFrame = 0;
let rafPending   = false;


// ── DOM ─────────────────────────────────────────────────────

const loader      = document.getElementById('loader');
const loaderFill  = document.querySelector('.loader-fill');
const loaderPct   = document.getElementById('loader-pct');
const canvas      = document.getElementById('flipbook-canvas');
const ctx         = canvas.getContext('2d');
const section     = document.getElementById('flipbook-section');
const stickyFrame = document.getElementById('sticky-frame');
const siteHeader  = document.getElementById('site-header');
const bgCanvas    = document.getElementById('bg-canvas');
const bgCtx       = bgCanvas.getContext('2d');
let   bgFrozen    = false;


// ── Canvas resize ────────────────────────────────────────────

function resizeCanvas() {
  document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
  const dpr = window.devicePixelRatio || 1;
  const cw  = window.innerWidth;
  const ch  = window.innerHeight - siteHeader.offsetHeight;
  canvas.width        = cw * dpr;
  canvas.height       = ch * dpr;
  canvas.style.width  = cw + 'px';
  canvas.style.height = ch + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(currentFrame);
}

window.addEventListener('resize', () => { resizeCanvas(); resizeBgCanvas(); });


// ── Background canvas resize ───────────────────────────────

function resizeBgCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const cw  = window.innerWidth;
  const ch  = window.innerHeight - siteHeader.offsetHeight;
  bgCanvas.width        = cw * dpr;
  bgCanvas.height       = ch * dpr;
  bgCanvas.style.width  = cw + 'px';
  bgCanvas.style.height = ch + 'px';
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (bgFrozen) drawLastFrameToBg();
}


// ── Freeze last frame onto background canvas ─────────────────

function drawLastFrameToBg() {
  const img = images[0];
  if (!img || !img.complete) return;

  const cw = parseFloat(bgCanvas.style.width)  || window.innerWidth;
  const ch = parseFloat(bgCanvas.style.height) || window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  bgCtx.fillStyle = '#edeeeb';
  bgCtx.fillRect(0, 0, cw, ch);

  bgCtx.imageSmoothingEnabled = true;
  bgCtx.imageSmoothingQuality = 'high';

  const scale = Math.max(cw / iw, ch / ih) * 0.89;
  const sw    = iw * scale;
  const sh    = ih * scale;
  const dx    = (cw - sw) / 2 - cw * 0.002;
  const dy    = (ch - sh) / 2 + VERTICAL_OFFSET;

  bgCtx.drawImage(img, dx, dy, sw, sh);
  bgFrozen = true;
}


// ── Draw frame ──────────────────────────────────────────────

function drawFrame(index) {
  const img = images[index];
  if (!img || !img.complete) return;

  const cw = parseFloat(canvas.style.width)  || window.innerWidth;
  const ch = parseFloat(canvas.style.height) || window.innerHeight;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  ctx.fillStyle = '#edeeeb';
  ctx.fillRect(0, 0, cw, ch);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const scale = Math.max(cw / iw, ch / ih) * 0.89;
  const sw    = iw * scale;
  const sh    = ih * scale;
  const dx    = (cw - sw) / 2 - cw * 0.002;
  const dy    = (ch - sh) / 2 + VERTICAL_OFFSET;

  ctx.drawImage(img, dx, dy, sw, sh);
}


// ── Scroll handler ──────────────────────────────────────────

function onScroll() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;

    const sectionTop    = section.offsetTop;
    const sectionHeight = section.scrollHeight - window.innerHeight;
    const scrolled      = window.scrollY - sectionTop;
    const progress      = Math.min(Math.max(scrolled / sectionHeight, 0), 1);
    const frameIndex    = Math.min(Math.floor((1 - progress) * TOTAL_FRAMES), TOTAL_FRAMES - 1);

    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      drawFrame(currentFrame);
    }

    // Fade sticky-frame out in the last 5% of scroll, revealing frozen bg-canvas
    stickyFrame.style.opacity = progress < 0.95
      ? '1'
      : String(Math.max(0, 1 - (progress - 0.95) / 0.05));
  });
}

window.addEventListener('scroll', onScroll, { passive: true });


// ── Preload all frames ──────────────────────────────────────

function preloadFrames() {
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = FRAME_PATH(i);

    img.onload = () => {
      loaded++;
      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      loaderFill.style.width = pct + '%';
      loaderPct.textContent  = pct + '%';
      if (i === 1)                 { resizeCanvas(); drawFrame(0); }
      if (i === TOTAL_FRAMES)      { resizeBgCanvas(); drawLastFrameToBg(); }
      if (loaded === TOTAL_FRAMES) { loader.classList.add('hidden'); onScroll(); }
    };

    img.onerror = () => {
      loaded++;
      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      loaderFill.style.width = pct + '%';
      loaderPct.textContent  = pct + '%';
      if (loaded === TOTAL_FRAMES) { loader.classList.add('hidden'); onScroll(); }
    };

    images[i - 1] = img;
  }
}


// ── Init ────────────────────────────────────────────────────

resizeCanvas();
resizeBgCanvas();
preloadFrames();
