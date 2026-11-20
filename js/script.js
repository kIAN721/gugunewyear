/* ==========================================================================
   GUGUNEWYEAR - COMPLETE ENGINE (SNOWGLOBE, 7 ORNAMENTS, 7-STAR HEART, 2026 RECAP, AUDIO & TELEGRAM)
   ========================================================================== */

const APP_STATE = {
  activeScene: 'christmas', // 'christmas' | 'newyear'
  xmasTargetDate: new Date('2026-12-25T00:00:00').getTime(),
  nyTargetDate: new Date('2027-01-01T00:00:00').getTime(),
  xmasUnlocked: false,
  nyUnlocked: false,
  devOverrideXmas: false,
  devOverrideNY: false
};

const bodyEl = document.body;
const tabChristmas = document.getElementById('tabChristmas');
const tabNewYear = document.getElementById('tabNewYear');
const sceneChristmas = document.getElementById('sceneChristmas');
const sceneNewYear = document.getElementById('sceneNewYear');
const toastMsg = document.getElementById('toastMsg');

/* ==========================================================================
   1. BUILT-IN WEB AUDIO SYNTHESIZER (CHIMES, SPARKLES & CELEBRATION CHORD)
   ========================================================================== */
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playChime(pitchMultiplier = 1) {
  try {
    initAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25 * pitchMultiplier, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {}
}

function playSparkleSfx() {
  try {
    initAudioContext();
    if (!audioCtx) return;

    [0, 0.08, 0.16].forEach((delay, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5 + idx * 200, audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.3);
    });
  } catch (e) {}
}

function playCelebrationChord() {
  try {
    initAudioContext();
    if (!audioCtx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => playChime(freq / 523.25), i * 90);
    });
  } catch (e) {}
}

/* ==========================================================================
   2. SMOOTH SCENE SWITCHER & URL ROUTING
   ========================================================================== */
function switchScene(targetScene, updateUrl = true) {
  if (targetScene !== 'christmas' && targetScene !== 'newyear') return;
  APP_STATE.activeScene = targetScene;
  bodyEl.setAttribute('data-scene', targetScene);

  const isXmas = targetScene === 'christmas';
  tabChristmas.classList.toggle('active', isXmas);
  tabChristmas.setAttribute('aria-selected', isXmas);
  tabNewYear.classList.toggle('active', !isXmas);
  tabNewYear.setAttribute('aria-selected', !isXmas);

  sceneChristmas.classList.toggle('active', isXmas);
  sceneNewYear.classList.toggle('active', !isXmas);

  if (updateUrl && window.history.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', targetScene);
    window.history.replaceState({}, '', url);
  }
}

tabChristmas.addEventListener('click', () => { initAudioContext(); switchScene('christmas'); });
tabNewYear.addEventListener('click', () => { initAudioContext(); switchScene('newyear'); });

function initSceneFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab');
  if (tabParam === 'newyear' || tabParam === 'christmas') {
    switchScene(tabParam, false);
  } else {
    const now = Date.now();
    const dec26 = new Date('2026-12-26T00:00:00').getTime();
    switchScene(now >= dec26 ? 'newyear' : 'christmas', false);
  }
}

/* ==========================================================================
   3. TOAST HELPER & 5-TAP SECRET DEVELOPER BYPASS
   ========================================================================== */
let toastTimer = null;
function showToast(message) {
  toastMsg.textContent = message;
  toastMsg.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.classList.remove('show');
  }, 2600);
}

function setupSecretDevBypass(buttonId, type) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  let tapCount = 0;
  let tapTimeout = null;

  btn.addEventListener('click', () => {
    initAudioContext();
    tapCount++;
    clearTimeout(tapTimeout);
    tapTimeout = setTimeout(() => { tapCount = 0; }, 1200);

    if (tapCount >= 5) {
      tapCount = 0;
      if (type === 'christmas') {
        APP_STATE.devOverrideXmas = !APP_STATE.devOverrideXmas;
        showToast(APP_STATE.devOverrideXmas ? '🎄 Dev Mode: Christmas Unlocked!' : '🔒 Dev Mode: Christmas Lock Restored');
      } else {
        APP_STATE.devOverrideNY = !APP_STATE.devOverrideNY;
        showToast(APP_STATE.devOverrideNY ? '✨ Dev Mode: New Year 2027 Unlocked!' : '🔒 Dev Mode: New Year Lock Restored');
      }
      updateCountdowns();
    }
  });
}

setupSecretDevBypass('xmasDevTrigger', 'christmas');
setupSecretDevBypass('nyDevTrigger', 'newyear');

/* ==========================================================================
   4. DUAL LIVE COUNTDOWN ENGINE
   ========================================================================== */
function formatUnit(val) {
  return String(Math.max(0, val)).padStart(2, '0');
}

function computeTimeParts(diffMs) {
  if (diffMs <= 0) return { days: '00', hours: '00', mins: '00', secs: '00' };
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return { days: formatUnit(days), hours: formatUnit(hours), mins: formatUnit(mins), secs: formatUnit(secs) };
}

function updateCountdowns() {
  const now = Date.now();

  // Christmas Countdown
  const xmasDiff = APP_STATE.xmasTargetDate - now;
  const isXmasReady = xmasDiff <= 0 || APP_STATE.devOverrideXmas;
  const xmasParts = computeTimeParts(isXmasReady ? 0 : xmasDiff);

  document.getElementById('xmasDays').textContent = xmasParts.days;
  document.getElementById('xmasHours').textContent = xmasParts.hours;
  document.getElementById('xmasMins').textContent = xmasParts.mins;
  document.getElementById('xmasSecs').textContent = xmasParts.secs;

  if (APP_STATE.xmasUnlocked !== isXmasReady) {
    APP_STATE.xmasUnlocked = isXmasReady;
    document.getElementById('xmasStatusTag').textContent = isXmasReady ? '🎄 Merry Christmas! Unlocked' : 'Unlocks Dec 25, 2026';
    const hintEl = document.getElementById('xmasStageHint');
    if (hintEl) {
      hintEl.textContent = isXmasReady ? '✨ Tap the Snowglobe to Enter Your Christmas Wonderland!' : '🔒 Waiting for Christmas Eve Midnight...';
    }

    if (!isXmasReady) {
      XMAS_STATE.litCount = 0;
      XMAS_STATE.giftOpened = false;
      renderXmasOrnaments();
      const stageTree = document.getElementById('xmasStageTree');
      const stageGlobe = document.getElementById('xmasStageGlobe');
      const headerCard = document.getElementById('xmasHeaderCard');
      if (stageTree && stageGlobe) {
        stageTree.classList.remove('active');
        stageGlobe.classList.add('active');
      }
      if (headerCard) headerCard.classList.remove('compact');
      closeMainLetterModal();
    }
  }

  // New Year Countdown
  const nyDiff = APP_STATE.nyTargetDate - now;
  const isNYReady = nyDiff <= 0 || APP_STATE.devOverrideNY;
  const nyParts = computeTimeParts(isNYReady ? 0 : nyDiff);

  document.getElementById('nyDays').textContent = nyParts.days;
  document.getElementById('nyHours').textContent = nyParts.hours;
  document.getElementById('nyMins').textContent = nyParts.mins;
  document.getElementById('nySecs').textContent = nyParts.secs;

  if (APP_STATE.nyUnlocked !== isNYReady) {
    APP_STATE.nyUnlocked = isNYReady;
    document.getElementById('nyStatusTag').textContent = isNYReady ? '🎆 Happy New Year 2027! Unlocked' : 'Unlocks Jan 1, 2027';

    if (!isNYReady) {
      NY_STATE.connectedCount = 0;
      NY_STATE.finaleTriggered = false;
      const nyHeader = document.getElementById('nyHeaderCard');
      const sunriseEl = document.getElementById('sunriseOverlay');
      if (nyHeader) nyHeader.classList.remove('compact');
      if (sunriseEl) sunriseEl.classList.remove('visible');
      closeMainLetterModal();
      closeRecapModal();
    }
    renderNYConstellation();
  }
}

/* ==========================================================================
   5. DUAL AMBIENT SKY CANVAS & FIREWORKS ENGINE
   ========================================================================== */
const canvas = document.getElementById('skyCanvas');
const ctx = canvas.getContext('2d');
let cw = 0;
let ch = 0;

const snowflakes = [];
const skyStars = [];
const sparklerParticles = [];
const fireworkRockets = [];
const fireworkSparks = [];

function resizeCanvas() {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw * window.devicePixelRatio;
  canvas.height = ch * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function initParticles() {
  snowflakes.length = 0;
  skyStars.length = 0;

  for (let i = 0; i < 65; i++) {
    snowflakes.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 2.6 + 1,
      speedY: Math.random() * 0.65 + 0.35,
      driftX: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.65 + 0.25
    });
  }

  for (let i = 0; i < 90; i++) {
    skyStars.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 1.8 + 0.5,
      baseAlpha: Math.random() * 0.6 + 0.25,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.01
    });
  }
}

function spawnSparkler(x, y) {
  for (let i = 0; i < 2; i++) {
    sparklerParticles.push({
      x, y,
      vx: (Math.random() - 0.5) * 1.6,
      vy: (Math.random() - 0.5) * 1.6 + 0.3,
      r: Math.random() * 2.2 + 0.8,
      alpha: 1,
      color: Math.random() > 0.35 ? '#FDE68A' : '#FCA5A5'
    });
  }
}

window.addEventListener('pointermove', (e) => {
  spawnSparkler(e.clientX, e.clientY);
});

const FIREWORK_PALETTES = [
  ['#FDE68A', '#F59E0B', '#FEF2F2'],
  ['#EF4444', '#FCA5A5', '#FDE68A'],
  ['#F59E0B', '#EF4444', '#FFFBEB']
];

function launchSingleFirework(customX) {
  const startX = customX || cw * (0.2 + Math.random() * 0.6);
  const targetY = ch * (0.14 + Math.random() * 0.32);
  const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];

  fireworkRockets.push({
    x: startX,
    y: ch,
    vx: (Math.random() - 0.5) * 1.4,
    vy: -(Math.random() * 3.5 + 7.2),
    targetY,
    palette
  });
}

function explodeFirework(x, y, palette) {
  playSparkleSfx();
  const count = 42;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.15;
    const speed = Math.random() * 3.8 + 1.2;
    fireworkSparks.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: Math.random() * 2.2 + 1,
      alpha: 1,
      decay: Math.random() * 0.015 + 0.012,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
}

function renderCanvas() {
  ctx.clearRect(0, 0, cw, ch);

  if (APP_STATE.activeScene === 'christmas') {
    for (const f of snowflakes) {
      f.y += f.speedY;
      f.x += f.driftX + Math.sin(f.y * 0.015) * 0.25;
      if (f.y > ch + 10) { f.y = -10; f.x = Math.random() * cw; }
      if (f.x > cw + 10) f.x = -10;
      if (f.x < -10) f.x = cw + 10;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 251, 235, ${f.alpha})`;
      ctx.fill();
    }
  } else {
    for (const s of skyStars) {
      s.phase += s.twinkleSpeed;
      const alpha = s.baseAlpha + Math.sin(s.phase) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(253, 230, 138, ${Math.max(0.1, alpha)})`;
      ctx.fill();
    }
  }

  for (let i = sparklerParticles.length - 1; i >= 0; i--) {
    const p = sparklerParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.032;
    if (p.alpha <= 0) { sparklerParticles.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (let i = fireworkRockets.length - 1; i >= 0; i--) {
    const r = fireworkRockets[i];
    r.x += r.vx;
    r.y += r.vy;
    r.vy += 0.06;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFBEB';
    ctx.fill();
    if (r.y <= r.targetY || r.vy >= 0) {
      explodeFirework(r.x, r.y, r.palette);
      fireworkRockets.splice(i, 1);
    }
  }

  for (let i = fireworkSparks.length - 1; i >= 0; i--) {
    const sp = fireworkSparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.045;
    sp.vx *= 0.985;
    sp.alpha -= sp.decay;
    if (sp.alpha <= 0) { fireworkSparks.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fillStyle = sp.color;
    ctx.globalAlpha = Math.max(0, sp.alpha);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(renderCanvas);
}

/* ==========================================================================
   6. TELEGRAM BOT WEBHOOK NOTIFICATION HELPER
   ========================================================================== */
const TELEGRAM_CONFIG = {
  botToken: "8832112215:AAGga3nuyOUKmOcTPjLs1FcU8zS9Rf7QCrc",
  chatId: "1694644020"
};

function sendTelegramAlert(eventText) {
  if (!TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CONFIG.chatId,
      text: `✨ [gugunewyear]\n${eventText}`
    })
  }).catch(() => {});
}

/* ==========================================================================
   7. MAIN LETTER MODAL & 2026 RECAP POLAROID TIMELINE MODAL
   ========================================================================== */
const letterModal = document.getElementById('letterModal');
const letterBadge = document.getElementById('letterBadge');
const letterTitle = document.getElementById('letterTitle');
const letterBody = document.getElementById('letterBody');
const letterCloseX = document.getElementById('letterCloseX');
const letterDoneBtn = document.getElementById('letterDoneBtn');

function openMainLetterModal(letterData) {
  letterBadge.textContent = letterData.badge;
  letterTitle.textContent = letterData.title;
  letterBody.textContent = letterData.body;

  letterModal.classList.add('open');
  letterModal.setAttribute('aria-hidden', 'false');
}

function closeMainLetterModal() {
  letterModal.classList.remove('open');
  letterModal.setAttribute('aria-hidden', 'true');
}

if (letterCloseX) letterCloseX.addEventListener('click', closeMainLetterModal);
if (letterDoneBtn) letterDoneBtn.addEventListener('click', closeMainLetterModal);
if (letterModal) {
  letterModal.addEventListener('click', (e) => {
    if (e.target === letterModal) closeMainLetterModal();
  });
}

/* --------------------------------------------------------------------------
   MANUAL 2026 YEAR RECAP TEMPLATE (ADD OR EDIT AS MANY PHOTOS AS YOU WANT!)
   - date:    Date or month label (e.g., "Oct 2026")
   - title:   Short memory title
   - photo:   Path to your image (e.g., "assets/recap1.jpg"). Leave "" for placeholder.
   - caption: Description underneath the photo (English or Burmese)
   -------------------------------------------------------------------------- */
const RECAP_2026 = [
  {
    date: 'Early Chapter • 2026',
    title: 'The Day We Started Talking',
    photo: 'images/recap1.jpg', // Example: 'assets/recap1.jpg'
    caption: 'The quiet little beginning that ended up becoming my favorite part of every single day.'
  },
  {
    date: 'First Meeting • 2026',
    title: 'The Day We First Met',
    photo: 'images/recap2.jpg', // Example: 'assets/recap2.jpg'
    caption: 'Seeing your smile in person for the very first time—something I will never forget.'
  },
  {
    date: 'Nov 2026',
    title: 'Before Setting Sail',
    photo: 'images/recap3.jpg', // Example: 'assets/recap3.jpg'
    caption: 'Thank you for your warmth, your early gift, and every sweet memory before my voyage.'
  },
  {
    date: 'Coming Soon • 2027',
    title: 'Our Next Chapter Together',
    photo: 'images/recap4.jpg', // Example: 'assets/recap4.jpg'
    caption: 'Reserved for our very first 2027 photo together the moment I step back on shore. ❤️'
  }
];

const recapModal = document.getElementById('recapModal');
const recapTimelineList = document.getElementById('recapTimelineList');
const recapCloseX = document.getElementById('recapCloseX');
const recapDoneBtn = document.getElementById('recapDoneBtn');

function renderRecapTimeline() {
  if (!recapTimelineList) return;
  recapTimelineList.innerHTML = '';

  RECAP_2026.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'recap-item';

    const photoHtml = item.photo && item.photo.trim() !== ''
      ? `<img src="${item.photo}" alt="${item.title}" loading="lazy" />`
      : `<div class="polaroid-placeholder"><span>📸</span><small>Memory Photo Slot</small></div>`;

    row.innerHTML = `
      <span class="recap-star-dot"></span>
      <article class="polaroid-card">
        <div class="polaroid-photo-box">${photoHtml}</div>
        <span class="polaroid-date">${item.date}</span>
        <h3 class="polaroid-title">${item.title}</h3>
        <p class="polaroid-caption">${item.caption}</p>
      </article>
    `;
    recapTimelineList.appendChild(row);
  });
}

function openRecapModal() {
  renderRecapTimeline();
  recapModal.classList.add('open');
  recapModal.setAttribute('aria-hidden', 'false');
}

function closeRecapModal() {
  recapModal.classList.remove('open');
  recapModal.setAttribute('aria-hidden', 'true');
}

if (recapCloseX) recapCloseX.addEventListener('click', closeRecapModal);
if (recapDoneBtn) recapDoneBtn.addEventListener('click', closeRecapModal);
if (recapModal) {
  recapModal.addEventListener('click', (e) => {
    if (e.target === recapModal) closeRecapModal();
  });
}

/* ==========================================================================
   8. PART 1: CHRISTMAS ENGINE (SNOWGLOBE -> 7 ORNAMENTS -> GIFT)
   ========================================================================== */
const XMAS_ORNAMENTS = [
  { id: 1, label: 'Ornament 1', x: 50, y: 74, isStar: false },
  { id: 2, label: 'Ornament 2', x: 34, y: 62, isStar: false },
  { id: 3, label: 'Ornament 3', x: 66, y: 62, isStar: false },
  { id: 4, label: 'Ornament 4', x: 40, y: 45, isStar: false },
  { id: 5, label: 'Ornament 5', x: 60, y: 45, isStar: false },
  { id: 6, label: 'Ornament 6', x: 50, y: 31, isStar: false },
  { id: 7, label: 'Star Topper', x: 50, y: 11, isStar: true }
];

const XMAS_MAIN_LETTER = {
  badge: '🎁 Merry Christmas 2026',
  title: 'To My Dearest GuGu ❤️',
  body: `Merry Christmas, my love! 🎄✨\n\nAs you unwrap this gift under our little Christmas tree, I hope you can feel how much thought and love I poured into every corner of this space for you.\n\nThank you for being my safe harbor, my happiness, and my favorite person through every season of 2026. Rest well, stay warm, and get ready—because in just a few days on January 1st, we will look up at the 2027 midnight sky together!\n\nForever yours,\nOneOne ❤️`
};

const XMAS_STATE = { litCount: 0, giftOpened: false };

const xmasStageGlobe = document.getElementById('xmasStageGlobe');
const xmasStageTree = document.getElementById('xmasStageTree');
const snowglobeBtn = document.getElementById('snowglobeBtn');
const globeInnerSnow = document.getElementById('globeInnerSnow');
const backToGlobeBtn = document.getElementById('backToGlobeBtn');
const ornamentsLayer = document.getElementById('ornamentsLayer');
const xmasProgressText = document.getElementById('xmasProgressText');
const xmasGiftContainer = document.getElementById('xmasGiftContainer');
const xmasGiftBtn = document.getElementById('xmasGiftBtn');

function initGlobeInnerSnow() {
  if (!globeInnerSnow) return;
  globeInnerSnow.innerHTML = '';
  for (let i = 0; i < 22; i++) {
    const flake = document.createElement('span');
    flake.className = 'globe-flake';
    flake.style.left = `${Math.random() * 88 + 6}%`;
    flake.style.animationDelay = `${Math.random() * 3}s`;
    flake.style.animationDuration = `${Math.random() * 1.6 + 2.2}s`;
    globeInnerSnow.appendChild(flake);
  }
}

if (snowglobeBtn) {
  snowglobeBtn.addEventListener('click', () => {
    initAudioContext();
    playSparkleSfx();
    snowglobeBtn.classList.remove('shake');
    void snowglobeBtn.offsetWidth;
    snowglobeBtn.classList.add('shake');

    const rect = snowglobeBtn.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      spawnSparkler(rect.left + rect.width / 2 + (Math.random() - 0.5) * 110, rect.top + rect.height / 2 + (Math.random() - 0.5) * 110);
    }

    if (!APP_STATE.xmasUnlocked) {
      showToast('❄️ Wait until Christmas Eve midnight to step inside the Snowglobe!');
      return;
    }

    snowglobeBtn.classList.add('zoom-into-tree');
    setTimeout(() => {
      xmasStageGlobe.classList.remove('active');
      xmasStageTree.classList.add('active');
      document.getElementById('xmasHeaderCard').classList.add('compact');
      snowglobeBtn.classList.remove('zoom-into-tree');
    }, 480);
  });
}

if (backToGlobeBtn) {
  backToGlobeBtn.addEventListener('click', () => {
    xmasStageTree.classList.remove('active');
    xmasStageGlobe.classList.add('active');
    document.getElementById('xmasHeaderCard').classList.remove('compact');
  });
}

function renderXmasOrnaments() {
  if (!ornamentsLayer) return;
  ornamentsLayer.innerHTML = '';

  XMAS_ORNAMENTS.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = 'ornament-node';
    if (item.isStar) btn.classList.add('is-star-topper');

    if (index < XMAS_STATE.litCount) {
      btn.classList.add('lit');
    } else if (index === XMAS_STATE.litCount) {
      btn.classList.add('next-up');
    }

    btn.style.left = `${item.x}%`;
    btn.style.top = `${item.y}%`;
    btn.innerHTML = item.isStar ? '⭐' : item.id;
    btn.setAttribute('aria-label', item.label);

    btn.addEventListener('click', (e) => handleOrnamentTap(index, e));
    ornamentsLayer.appendChild(btn);
  });

  if (xmasProgressText) {
    xmasProgressText.textContent = XMAS_STATE.litCount >= 7
      ? '✨ All 7 Ornaments Lit! Unwrap Your Gift Below!'
      : `Light the 7 Christmas Ornaments (${XMAS_STATE.litCount} / 7)`;
  }

  if (xmasGiftContainer) {
    xmasGiftContainer.classList.toggle('unlocked', XMAS_STATE.litCount >= 7);
  }
}

function handleOrnamentTap(index, event) {
  initAudioContext();
  if (!APP_STATE.xmasUnlocked || !xmasStageTree.classList.contains('active')) return;

  if (index > XMAS_STATE.litCount) {
    showToast(`🎄 Tap Ornament #${XMAS_STATE.litCount + 1} first!`);
    return;
  }

  playChime(1.0 + index * 0.1);

  if (event && event.clientX) {
    for (let i = 0; i < 14; i++) {
      spawnSparkler(event.clientX + (Math.random() - 0.5) * 40, event.clientY + (Math.random() - 0.5) * 40);
    }
  }

  if (index === XMAS_STATE.litCount) {
    XMAS_STATE.litCount++;
    renderXmasOrnaments();

    if (XMAS_STATE.litCount === 7) {
      playCelebrationChord();
      showToast('🎄 Tree is glowing! Tap your Christmas Gift below!');
    }
  }
}

if (xmasGiftBtn) {
  xmasGiftBtn.addEventListener('click', (e) => {
    initAudioContext();
    if (!APP_STATE.xmasUnlocked || XMAS_STATE.litCount < 7) return;
    playCelebrationChord();
    for (let i = 0; i < 24; i++) {
      spawnSparkler(e.clientX + (Math.random() - 0.5) * 90, e.clientY + (Math.random() - 0.5) * 90);
    }
    XMAS_STATE.giftOpened = true;
    document.getElementById('giftBoxEmoji').textContent = '💝';
    document.getElementById('giftBoxLabel').textContent = 'Open Christmas Letter Again';
    openMainLetterModal(XMAS_MAIN_LETTER);
    sendTelegramAlert('🎁 GuGu just unwrapped her Christmas Gift & opened your Christmas Letter!');
  });
}

initGlobeInnerSnow();
renderXmasOrnaments();

/* ==========================================================================
   9. PART 2: NEW YEAR 7-STAR SYMMETRICAL CURVED HEART CONSTELLATION
   ========================================================================== */
const NY_STARS = [
  { id: 1, label: 'Star 1', x: 50, y: 84 },
  { id: 2, label: 'Star 2', x: 20, y: 56 },
  { id: 3, label: 'Star 3', x: 18, y: 28 },
  { id: 4, label: 'Star 4', x: 36, y: 16 },
  { id: 5, label: 'Star 5', x: 64, y: 16 },
  { id: 6, label: 'Star 6', x: 82, y: 28 },
  { id: 7, label: 'Star 7', x: 80, y: 56 }
];

const HEART_CURVE_PATHS = [
  'M 50 84 Q 32 72 20 56',
  'M 20 56 Q 10 42 18 28',
  'M 18 28 Q 25 14 36 16',
  'M 36 16 Q 46 18 50 32 Q 54 18 64 16',
  'M 64 16 Q 75 14 82 28',
  'M 82 28 Q 90 42 80 56',
  'M 80 56 Q 68 72 50 84'
];

const NY_MAIN_LETTER = {
  badge: '🎆 Happy New Year 2027',
  title: 'Under the Same 2027 Sky, GuGu ✨',
  body: `Happy New Year 2027, my dearest GuGu! 🎆🌅\n\nAs our 7-star heart shines in the sky and the first peach-gold dawn of 2027 rises on the horizon, my first wish of the year belongs completely to you.\n\nNo matter where my ship sails this year, every star I see at night and every wave that touches the shore reminds me of coming home to you. Stay happy, stay safe, and know that OneOne loves you endlessly—today, tomorrow, and through all of 2027.\n\nForever yours,\nOneOne ❤️`
};

const NY_STATE = { connectedCount: 0, finaleTriggered: false };

const starsLayer = document.getElementById('starsLayer');
const constellationLinesGroup = document.getElementById('constellationLinesGroup');
const heartPolygonFill = document.getElementById('heartPolygonFill');
const nyProgressText = document.getElementById('nyProgressText');
const nyLetterReveal = document.getElementById('nyLetterReveal');
const nyRecapBtn = document.getElementById('nyRecapBtn');
const nyLetterBtn = document.getElementById('nyLetterBtn');
const launchFireworkBtn = document.getElementById('launchFireworkBtn');
const sunriseOverlay = document.getElementById('sunriseOverlay');

function renderNYConstellation() {
  if (!starsLayer || !constellationLinesGroup) return;
  starsLayer.innerHTML = '';
  constellationLinesGroup.innerHTML = '';

  const segmentsToDraw = NY_STATE.connectedCount >= 7
    ? HEART_CURVE_PATHS.length
    : Math.max(0, NY_STATE.connectedCount - 1);

  for (let i = 0; i < segmentsToDraw; i++) {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', HEART_CURVE_PATHS[i]);
    pathEl.setAttribute('class', 'constellation-path');
    constellationLinesGroup.appendChild(pathEl);
  }

  NY_STARS.forEach((star, index) => {
    const btn = document.createElement('button');
    btn.className = 'star-node';
    if (index === 6) btn.classList.add('is-core-star');

    if (index < NY_STATE.connectedCount) {
      btn.classList.add('connected');
    } else if (APP_STATE.nyUnlocked && index === NY_STATE.connectedCount) {
      btn.classList.add('next-up');
    }

    btn.style.left = `${star.x}%`;
    btn.style.top = `${star.y}%`;
    btn.innerHTML = index === 6 ? '💖' : `✦${star.id}`;
    btn.setAttribute('aria-label', star.label);

    btn.addEventListener('click', (e) => handleStarTap(index, e));
    starsLayer.appendChild(btn);
  });

  if (nyProgressText) {
    if (!APP_STATE.nyUnlocked) {
      nyProgressText.textContent = '🔒 Unlocks at 2027 Midnight (0 / 7 Stars)';
    } else if (NY_STATE.connectedCount >= 7) {
      nyProgressText.textContent = '🎆 Our 2027 Heart Constellation is Complete!';
    } else {
      nyProgressText.textContent = `Connect the 7 Golden Stars (${NY_STATE.connectedCount} / 7)`;
    }
  }

  const isAllDone = APP_STATE.nyUnlocked && NY_STATE.connectedCount >= 7;
  if (heartPolygonFill) heartPolygonFill.classList.toggle('complete', isAllDone);
  if (nyLetterReveal) nyLetterReveal.classList.toggle('unlocked', isAllDone);
  if (launchFireworkBtn) launchFireworkBtn.hidden = !isAllDone;
}

function handleStarTap(index, event) {
  initAudioContext();
  if (APP_STATE.activeScene !== 'newyear') return;

  if (!APP_STATE.nyUnlocked) {
    showToast('🌟 Wait until 2027 Midnight so we can connect our stars under the same sky!');
    return;
  }

  if (index > NY_STATE.connectedCount) {
    showToast(`✨ Tap Star #${NY_STATE.connectedCount + 1} next to trace our heart!`);
    return;
  }

  playChime(1.0 + index * 0.12);

  if (event && event.clientX) {
    for (let i = 0; i < 16; i++) {
      spawnSparkler(event.clientX + (Math.random() - 0.5) * 45, event.clientY + (Math.random() - 0.5) * 45);
    }
  }

  document.getElementById('nyHeaderCard').classList.add('compact');

  if (index === NY_STATE.connectedCount) {
    NY_STATE.connectedCount++;
    renderNYConstellation();

    if (NY_STATE.connectedCount === 1) {
      sendTelegramAlert('🌟 GuGu just started connecting the 2027 Heart Constellation (Star #1)!');
    }

    if (NY_STATE.connectedCount >= 7 && !NY_STATE.finaleTriggered) {
      NY_STATE.finaleTriggered = true;
      setTimeout(() => {
        trigger2027GrandFinale();
      }, 350);
    }
  }
}

function trigger2027GrandFinale() {
  playCelebrationChord();
  showToast('🎆 Happy New Year 2027! Welcome to our first sunrise!');
  if (sunriseOverlay) sunriseOverlay.classList.add('visible');

  for (let i = 0; i < 7; i++) {
    setTimeout(() => {
      launchSingleFirework();
    }, i * 420);
  }

  sendTelegramAlert('🎆 GuGu completed all 7 Stars in the 2027 Heart Constellation & triggered the Midnight Fireworks!');
}

if (launchFireworkBtn) {
  launchFireworkBtn.addEventListener('click', () => {
    initAudioContext();
    launchSingleFirework();
    launchSingleFirework();
  });
}

if (nyRecapBtn) {
  nyRecapBtn.addEventListener('click', () => {
    initAudioContext();
    if (!APP_STATE.nyUnlocked || NY_STATE.connectedCount < 7) return;
    playSparkleSfx();
    openRecapModal();
    sendTelegramAlert('📸 GuGu just opened the 2026 Year Recap Polaroid Timeline!');
  });
}

if (nyLetterBtn) {
  nyLetterBtn.addEventListener('click', (e) => {
    initAudioContext();
    if (!APP_STATE.nyUnlocked || NY_STATE.connectedCount < 7) return;
    launchSingleFirework(e.clientX);
    openMainLetterModal(NY_MAIN_LETTER);
    sendTelegramAlert('💌 GuGu just opened your Main 2027 New Year Letter!');
  });
}

/* ==========================================================================
   10. BACKGROUND MUSIC (BGM) TOGGLE
   ========================================================================== */
const BGM_CONFIG = { src: '', normalVolume: 0.5 };
const bgmAudio = new Audio();
bgmAudio.loop = true;
bgmAudio.volume = BGM_CONFIG.normalVolume;
if (BGM_CONFIG.src) bgmAudio.src = BGM_CONFIG.src;

const bgmToggle = document.getElementById('bgmToggle');
const bgmIcon = document.getElementById('bgmIcon');
let isBgmPlaying = false;

if (bgmToggle) {
  bgmToggle.addEventListener('click', () => {
    initAudioContext();
    if (!BGM_CONFIG.src || BGM_CONFIG.src.trim() === '') {
      showToast('🎵 Built-in crystal chimes active! (Add MP3 to BGM_CONFIG.src if desired)');
      return;
    }
    if (isBgmPlaying) {
      bgmAudio.pause();
      isBgmPlaying = false;
      bgmIcon.textContent = '🔇';
    } else {
      bgmAudio.play().then(() => {
        isBgmPlaying = true;
        bgmIcon.textContent = '🎵';
      }).catch(() => {});
    }
  });
}

// Initialize App
window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});

resizeCanvas();
initParticles();
initSceneFromUrl();
updateCountdowns();
setInterval(updateCountdowns, 1000);
requestAnimationFrame(renderCanvas);
renderNYConstellation();