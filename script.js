const termContainer = document.querySelector('#term');
const display = document.querySelector('#term-text');
const diagram = document.querySelector('#diagram');
const stage = document.querySelector('main');
let diagramVisible = false;
let hoverBlocked = false;
let wordTimer;
const heartOutline = new Path2D("M508.419 382.43C521.248 379.857 534.079 379.857 546.907 382.429H546.908C559.826 384.94 571.308 390.06 581.345 397.789C591.145 405.333 597.716 414.216 601.022 424.441L601.322 425.393C604.323 435.233 604.222 445.138 601.022 455.093C597.796 465.38 591.226 474.388 581.348 482.118L458.323 578.394L458.016 578.635L457.707 578.394L334.683 482.118C324.804 474.387 318.194 465.38 314.888 455.093L314.887 455.089C311.665 444.814 311.704 434.593 315.008 424.441L315.327 423.487C318.728 413.663 325.191 405.097 334.686 397.789C344.721 390.061 356.162 384.942 369 382.43L370.21 382.196C382.714 379.86 395.182 379.937 407.611 382.43H407.61C420.526 385.004 432.006 390.122 442.042 397.787L458.015 409.919L473.988 397.787H473.989C484.104 390.123 495.582 385.004 508.419 382.43Z");
const hitContext = document.createElement("canvas").getContext("2d");

function revealDiagram() {
  if (hoverBlocked) return;
  if (!diagram.complete || !diagram.naturalWidth) return;
  clearInterval(wordTimer);
  diagramVisible = true;
  diagram.hidden = false;
  stage.classList.add('showing-diagram');
}

function restoreTerms() {
  if (!diagramVisible) return;
  hoverBlocked = true;
  clearInterval(wordTimer);
  wordTimer = setInterval(advanceTerm, 1000);
  diagramVisible = false;
  diagram.hidden = true;
  stage.classList.remove('showing-diagram');
}

display.addEventListener('pointerenter', revealDiagram);
display.addEventListener('focus', revealDiagram);
display.addEventListener('blur', restoreTerms);
diagram.addEventListener('pointerleave', restoreTerms);
document.addEventListener('pointermove', event => {
  if (hoverBlocked) {
    const textBounds = display.getBoundingClientRect();
    if (event.clientX < textBounds.left || event.clientX > textBounds.right ||
        event.clientY < textBounds.top || event.clientY > textBounds.bottom) hoverBlocked = false;
  }
  if (!diagramVisible) return;
  const bounds = diagram.getBoundingClientRect();
  const scale = Math.min(bounds.width / 917, bounds.height / 916);
  const left = bounds.left + (bounds.width - 917 * scale) / 2;
  const top = bounds.top + (bounds.height - 916 * scale) / 2;
  const x = (event.clientX - left) / scale;
  const y = (event.clientY - top) / scale;
  if (!hitContext.isPointInPath(heartOutline, x, y)) {
    restoreTerms();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') restoreTerms();
});
window.addEventListener('blur', restoreTerms);
const pixelLayer = document.querySelector('#pixels');
const heartCursor = document.createElement('span');
heartCursor.id = 'heart-cursor';
heartCursor.className = 'heart';
heartCursor.textContent = '♥';
heartCursor.setAttribute('aria-hidden', 'true');
document.body.append(heartCursor);
const stampLayer = document.createElement('div');
stampLayer.id = 'heart-stamps';
stampLayer.setAttribute('aria-hidden', 'true');
document.body.append(stampLayer);

document.addEventListener('click', event => {
  if (event.detail === 0) return;
  const stamp = document.createElement('span');
  stamp.className = 'heart heart-stamp';
  stamp.textContent = '♥';
  stamp.style.left = `${event.clientX}px`;
  stamp.style.top = `${event.clientY}px`;
  stampLayer.append(stamp);
});

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
  stampLayer.replaceChildren();
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
    const available = Math.max(1, termContainer.clientWidth - 4);
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
function advanceTerm() {
  if (!terms.length || document.hidden || diagramVisible) return;
  if (terms.length > 1) {
    const offset = 1 + Math.floor(Math.random() * (terms.length - 1));
    index = (index + offset) % terms.length;
  }
  showTerm(terms[index]);
}
wordTimer = setInterval(advanceTerm, 1000);
