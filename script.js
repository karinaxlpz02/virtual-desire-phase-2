const termContainer = document.querySelector('#term');
const display = document.querySelector('#term-text');
const diagram = document.querySelector('#diagram');
const stage = document.querySelector('main');
let diagramVisible = false;
let wordTimer;
let pointerPosition = null;
const mobileInteraction = window.matchMedia('(hover: none), (pointer: coarse)');

function revealDiagram() {
  if (diagramVisible) return;
  if (!diagram.complete || !diagram.naturalWidth) return;
  clearInterval(wordTimer);
  diagramVisible = true;
  diagram.hidden = false;
  stage.classList.add('showing-diagram');
}

function restoreTerms() {
  if (!diagramVisible) return;
  clearInterval(wordTimer);
  wordTimer = setInterval(advanceTerm, 1000);
  diagramVisible = false;
  diagram.hidden = true;
  stage.classList.remove('showing-diagram');
}

function insideCenterCircle(x, y) {
  // A medium circle, shrinking proportionally on smaller screens.
  const radius = Math.min(150, window.innerWidth * 0.22, window.innerHeight * 0.22);
  const distance = Math.hypot(
    x - window.innerWidth / 2,
    y - window.innerHeight / 2
  );
  return distance <= radius;
}

function updateCenterHover() {
  if (!pointerPosition || mobileInteraction.matches) return;
  if (insideCenterCircle(pointerPosition.x, pointerPosition.y)) revealDiagram();
  else restoreTerms();
}

document.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || mobileInteraction.matches) return;
  pointerPosition = { x: event.clientX, y: event.clientY };
  updateCenterHover();
});
function leaveCenterHover() {
  pointerPosition = null;
  restoreTerms();
}
document.documentElement.addEventListener('pointerleave', () => {
  if (!mobileInteraction.matches) leaveCenterHover();
});
document.addEventListener('pointercancel', () => {
  if (!mobileInteraction.matches) leaveCenterHover();
});
window.addEventListener('resize', updateCenterHover);
diagram.addEventListener('load', updateCenterHover);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') restoreTerms();
});
window.addEventListener('blur', leaveCenterHover);
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
  if (mobileInteraction.matches) {
    if (diagramVisible) restoreTerms();
    else if (insideCenterCircle(event.clientX, event.clientY)) revealDiagram();
  }
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
  const width = pixelLayer.clientWidth;
  const height = pixelLayer.clientHeight;
  const sizes = [pixels, hearts].map(group => ({
    group, width: group[0].offsetWidth, height: group[0].offsetHeight
  }));
  for (const size of sizes) {
    for (const pixel of size.group) {
      pixel.style.left = `${Math.random() * Math.max(0, width - size.width)}px`;
      pixel.style.top = `${Math.random() * Math.max(0, height - size.height)}px`;
    }
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
  termContainer.style.removeProperty('transform');
  const style = getComputedStyle(display);
  const baseSize = parseFloat(style.fontSize);
  measureContext.font = `${style.fontWeight} ${baseSize}px ${style.fontFamily}`;
  let widest = 0;
  for (const term of terms) {
    widest = Math.max(widest, measureContext.measureText(term).width);
  }
  if (widest > 0) {
    const available = Math.max(1, termContainer.clientWidth - 4);
    const fittedSize = baseSize * Math.min(1, available / widest);
    const mobileBonus = window.matchMedia('(max-width: 600px)').matches ? 2 * 96 / 72 : 0;
    const fontSize = fittedSize + mobileBonus;
    display.style.fontSize = `${fontSize}px`;
    // Preserve one line and side padding with the larger mobile type.
    const horizontalScale = Math.min(1, available / (widest * fontSize / baseSize));
    termContainer.style.transform = `scaleX(${horizontalScale})`;
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
