const display = document.querySelector('#term');
const pixelLayer = document.querySelector('#pixels');
const heartCursor = document.createElement('span');
heartCursor.id = 'heart-cursor';
heartCursor.className = 'heart';
heartCursor.textContent = '♥';
heartCursor.setAttribute('aria-hidden', 'true');
document.body.append(heartCursor);

function hideHeartCursor() {
  document.documentElement.classList.remove('heart-cursor-active');
}

document.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') {
    hideHeartCursor();
    return;
  }
  heartCursor.style.left = `${event.clientX}px`;
  heartCursor.style.top = `${event.clientY}px`;
  document.documentElement.classList.add('heart-cursor-active');
});
document.documentElement.addEventListener('pointerleave', hideHeartCursor);
document.addEventListener('pointercancel', hideHeartCursor);
window.addEventListener('blur', hideHeartCursor);
const pixels = Array.from({ length: 300 }, () => {
  const pixel = document.createElement('span');
  pixel.className = 'pixel';
  pixelLayer.append(pixel);
  return pixel;
});
const hearts = Array.from({ length: 100 }, () => {
  const heart = document.createElement('span');
  heart.className = 'pixel heart';
  heart.textContent = '♥';
  pixelLayer.append(heart);
  return heart;
});

function scatterPixels() {
  for (const pixel of [...pixels, ...hearts]) {
    pixel.style.left = `${Math.random() * Math.max(0, pixelLayer.clientWidth - pixel.offsetWidth)}px`;
    pixel.style.top = `${Math.random() * Math.max(0, pixelLayer.clientHeight - pixel.offsetHeight)}px`;
  }
}

function showTerm(term) {
  if (display.textContent === term) return;
  display.textContent = term;
  scatterPixels();
}

scatterPixels();
window.addEventListener('resize', scatterPixels);
let terms = [];
let index = 0;
let customFontLoaded = false;
const measureContext = document.createElement('canvas').getContext('2d');

function fitTerms() {
  display.style.removeProperty('font-size');
  const style = getComputedStyle(display);
  const baseSize = parseFloat(style.fontSize);
  measureContext.font = `${style.fontWeight} ${baseSize}px ${style.fontFamily}`;
  let widest = 0;
  for (const term of terms) {
    widest = Math.max(widest, measureContext.measureText(term).width);
  }
  if (widest > 0) {
    const available = Math.max(1, display.clientWidth - 4);
    display.style.fontSize = `${baseSize * Math.min(1, available / widest)}px`;
  }
}

window.addEventListener('resize', fitTerms);
document.fonts.addEventListener('loadingdone', fitTerms);

async function refreshTerms() {
  try {
    const response = await fetch('assets/words.txt', { cache: 'no-store' });
    if (!response.ok) throw new Error('Words file unavailable');
    const next = [...new Set((await response.text()).split(/\r?\n/).map(term => term.trim()).filter(Boolean))];
    if (JSON.stringify(next) === JSON.stringify(terms)) return;
    const current = terms[index];
    terms = next;
    fitTerms();
    index = terms.includes(current) ? terms.indexOf(current) : Math.floor(Math.random() * terms.length);
    showTerm(terms[index] || '');
  } catch (error) {
    console.warn('Could not refresh terms:', error);
    if (!terms.length) showTerm('Add your words');
  }
}

async function refreshFont() {
  if (customFontLoaded) return;
  for (const filename of ['AFMathis-Regular.otf', 'font.woff2', 'font.woff', 'font.ttf', 'font.otf']) {
    try {
      const response = await fetch(`assets/${filename}`, { cache: 'no-store' });
      if (!response.ok) continue;
      const font = new FontFace('DisplayFont', await response.arrayBuffer());
      await font.load();
      document.fonts.add(font);
      document.documentElement.style.setProperty('--display-font', "'DisplayFont', 'Inter', sans-serif");
      customFontLoaded = true;
      fitTerms();
      return;
    } catch { /* Use Inter until a valid custom font is available. */ }
  }
}

async function refreshAssets() {
  await Promise.all([refreshTerms(), refreshFont()]);
  setTimeout(refreshAssets, 2000);
}
refreshAssets();
setInterval(() => {
  if (!terms.length || document.hidden) return;
  if (terms.length > 1) {
    const offset = 1 + Math.floor(Math.random() * (terms.length - 1));
    index = (index + offset) % terms.length;
  }
  showTerm(terms[index]);
}, 1000);
