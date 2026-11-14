/* ==========================================================================
   GUGUNEWYEAR - COMPLETE ENGINE (SNOWGLOBE, 7 ORNAMENTS, 7-STAR HEART, AUDIO & TELEGRAM)
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

// DOM Elements
const bodyEl = document.body;
const tabChristmas = document.getElementById('tabChristmas');
const tabNewYear = document.getElementById('tabNewYear');
const sceneChristmas = document.getElementById('sceneChristmas');
const sceneNewYear = document.getElementById('sceneNewYear');
const toastMsg = document.getElementById('toastMsg');

/* ==========================================================================
   1. BUILT-IN WEB AUDIO SYNTHESIZER (CHIMES, SPARKLES & FIREWORKS SFX)
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

// Play magical crystal chime (rising pitches for stars 1 -> 7)
function playChime(pitchMultiplier = 1) {
  try {
    initAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Base frequency around 523.25 Hz (C5), scaling up nicely
    const freq = 523.25 * pitchMultiplier;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.22, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    // Audio context restricted or blocked
  }
}

// Play a soft sparkle burst sound
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

// Play a celebratory chord when gift is opened or heart is completed
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
      if (miniCardModal) miniCardModal.classList.remove('open');
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
   7. SHARED MODALS (MINI ORNAMENT/STAR CARD & MAIN LETTER + VOICE NOTE)
   ========================================================================== */
const miniCardModal = document.getElementById('miniCardModal');
const miniCardBadge = document.getElementById('miniCardBadge');
const miniCardTitle = document.getElementById('miniCardTitle');
const miniCardPhotoWrap = document.getElementById('miniCardPhotoWrap');
const miniCardPhoto = document.getElementById('miniCardPhoto');
const miniCardText = document.getElementById('miniCardText');
const miniCardCloseBtn = document.getElementById('miniCardCloseBtn');

const letterModal = document.getElementById('letterModal');
const letterBadge = document.getElementById('letterBadge');
const letterTitle = document.getElementById('letterTitle');
const letterBody = document.getElementById('letterBody');
const letterCloseX = document.getElementById('letterCloseX');
const letterDoneBtn = document.getElementById('letterDoneBtn');
const voicePlayBtn = document.getElementById('voicePlayBtn');
const voiceLabel = document.getElementById('voiceLabel');
const voiceProgressFill = document.getElementById('voiceProgressFill');
const voiceTime = document.getElementById('voiceTime');

let activeVoiceAudio = new Audio();

function openMiniCardModal(item) {
  miniCardBadge.textContent = item.badge;
  miniCardTitle.textContent = item.title;
  miniCardText.textContent = item.text;

  if (item.photo && item.photo.trim() !== '') {
    miniCardPhoto.src = item.photo;
    miniCardPhotoWrap.hidden = false;
  } else {
    miniCardPhotoWrap.hidden = true;
  }

  miniCardModal.classList.add('open');
  miniCardModal.setAttribute('aria-hidden', 'false');
}

if (miniCardCloseBtn) {
  miniCardCloseBtn.addEventListener('click', () => {
    miniCardModal.classList.remove('open');
    miniCardModal.setAttribute('aria-hidden', 'true');
  });
}

function openMainLetterModal(letterData) {
  letterBadge.textContent = letterData.badge;
  letterTitle.textContent = letterData.title;
  letterBody.textContent = letterData.body;
  voiceLabel.textContent = letterData.voiceLabel || 'Voice Message';

  activeVoiceAudio.pause();
  voicePlayBtn.textContent = '▶';
  voiceProgressFill.style.width = '0%';
  voiceTime.textContent = '0:00';

  if (letterData.voiceSrc && letterData.voiceSrc.trim() !== '') {
    activeVoiceAudio.src = letterData.voiceSrc;
  } else {
    activeVoiceAudio.src = '';
  }

  letterModal.classList.add('open');
  letterModal.setAttribute('aria-hidden', 'false');
}

function closeMainLetterModal() {
  activeVoiceAudio.pause();
  voicePlayBtn.textContent = '▶';
  letterModal.classList.remove('open');
  letterModal.setAttribute('aria-hidden', 'true');
}

if (letterCloseX) letterCloseX.addEventListener('click', closeMainLetterModal);
if (letterDoneBtn) letterDoneBtn.addEventListener('click', closeMainLetterModal);

if (voicePlayBtn) {
  voicePlayBtn.addEventListener('click', () => {
    initAudioContext();
    if (!activeVoiceAudio.src || activeVoiceAudio.src === window.location.href) {
      showToast('🎙️ Add your voice file path to voiceSrc if desired!');
      return;
    }
    if (activeVoiceAudio.paused) {
      activeVoiceAudio.play();
      voicePlayBtn.textContent = '⏸';
    } else {
      activeVoiceAudio.pause();
      voicePlayBtn.textContent = '▶';
    }
  });
}

activeVoiceAudio.addEventListener('timeupdate', () => {
  if (!activeVoiceAudio.duration) return;
  const pct = (activeVoiceAudio.currentTime / activeVoiceAudio.duration) * 100;
  voiceProgressFill.style.width = `${pct}%`;
  const secs = Math.floor(activeVoiceAudio.currentTime % 60);
  const mins = Math.floor(activeVoiceAudio.currentTime / 60);
  voiceTime.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
});

activeVoiceAudio.addEventListener('ended', () => {
  voicePlayBtn.textContent = '▶';
  voiceProgressFill.style.width = '0%';
});

/* ==========================================================================
   8. PART 1: CHRISTMAS ENGINE (SNOWGLOBE -> 7 ORNAMENTS -> GIFT)
   ========================================================================== */
const XMAS_ORNAMENTS = [
  { id: 1, badge: '🎄 Ornament #1', title: 'Our Cozy December Warmth', text: 'Even when the winter wind gets chilly, thinking of your smile always feels like sitting beside a warm fireplace.', photo: '', x: 50, y: 74, isStar: false },
  { id: 2, badge: '🎄 Ornament #2', title: 'My Favorite Gift Every Year', text: 'No matter how many holiday lights shine around the world, having you in my life is still the brightest blessing of all.', photo: '', x: 34, y: 62, isStar: false },
  { id: 3, badge: '🎄 Ornament #3', title: 'Every Little Laugh With You', text: 'Thank you for every sweet conversation, every silly moment, and for always making my heart feel right at home.', photo: '', x: 66, y: 62, isStar: false },
  { id: 4, badge: '🎄 Ornament #4', title: 'Across Every Mile & Wave', text: 'Even when I am preparing for the sea or far away, my heart stays anchored right next to you this Christmas.', photo: '', x: 40, y: 45, isStar: false },
  { id: 5, badge: '🎄 Ornament #5', title: 'A Promise Under the Mistletoe', text: 'I promise to keep building more beautiful memories, more surprises, and more warm chapters for just the two of us.', photo: '', x: 60, y: 45, isStar: false },
  { id: 6, badge: '🎄 Ornament #6', title: 'Wishing You Peace & Joy', text: 'May your Christmas be filled with cozy rest, your favorite treats, and the certainty that you are deeply loved.', photo: '', x: 50, y: 31, isStar: false },
  { id: 7, badge: '🌟 The 7th Star Topper', title: 'You Are My Guiding Star, GuGu', text: 'Just like the star on top of the Christmas tree, you guide my heart home. Now look underneath the tree—a special gift is waiting for you!', photo: '', x: 50, y: 11, isStar: true }
];

const XMAS_MAIN_LETTER = {
  badge: '🎁 Merry Christmas 2026',
  title: 'To My Dearest GuGu ❤️',
  voiceLabel: 'Listen to my Christmas Voice Message',
  voiceSrc: '',
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
  snowglobeBtn.addEventListener('click', (e) => {
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
    btn.setAttribute('aria-label', item.badge);

    btn.addEventListener('click', (e) => handleOrnamentTap(index, item, e));
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

function handleOrnamentTap(index, item, event) {
  initAudioContext();
  if (!APP_STATE.xmasUnlocked || !xmasStageTree.classList.contains('active')) return;

  if (index > XMAS_STATE.litCount) {
    showToast(`🎄 Tap Ornament #${XMAS_STATE.litCount + 1} first!`);
    return;
  }

  // Play ascending crystal chime pitch (1.0 to 1.7)
  playChime(1.0 + index * 0.1);

  if (event && event.clientX) {
    for (let i = 0; i < 14; i++) {
      spawnSparkler(event.clientX + (Math.random() - 0.5) * 40, event.clientY + (Math.random() - 0.5) * 40);
    }
  }

  if (index === XMAS_STATE.litCount) {
    XMAS_STATE.litCount++;
    renderXmasOrnaments();
  }

  openMiniCardModal(item);
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
   9. PART 2: NEW YEAR 7-STAR TRUE HEART CONSTELLATION ENGINE
   ========================================================================== */
// True Heart Perimeter Layout (7 distinct points forming an unmistakable heart silhouette)
const NY_STARS = [
  { id: 1, badge: '🌟 Star #1 • Bottom Tip', title: 'Our First Spark of 2027', text: 'Look up at the midnight sky, GuGu. Even when waves and miles are between us, we are always standing under this exact same canopy of stars.', photo: '', x: 50, y: 85 },
  { id: 2, badge: '🌟 Star #2 • Lower-Left Curve', title: 'Every Memory From 2026', text: 'Thank you for filling my 2026 with warmth, patience, and the sweetest memories I carry with me everywhere I go.', photo: '', x: 22, y: 58 },
  { id: 3, badge: '🌟 Star #3 • Upper-Left Outer Lobe', title: 'My Compass at Sea', text: 'Mariners used to navigate the ocean by the stars—and you are the only North Star my heart will ever follow home.', photo: '', x: 16, y: 32 },
  { id: 4, badge: '🌟 Star #4 • Top-Left Arch Peak', title: 'Two Hearts, One Horizon', text: 'Every sunrise I watch over the water is the same sun coming to wake you up and keep you warm.', photo: '', x: 33, y: 16 },
  { id: 5, badge: '🌟 Star #5 • Center Heart Dip', title: 'A Promise for the New Year', text: 'In 2027, I promise more laughter, more late-night talks, and the sweetest reunion the moment I step back on shore.', photo: '', x: 50, y: 30 },
  { id: 6, badge: '🌟 Star #6 • Top-Right Arch Peak', title: 'Wishing You a Gentle Year', text: 'May all 365 days of 2027 treat you kindly, keep you healthy, and bring every dream in your heart to life.', photo: '', x: 67, y: 16 },
  { id: 7, badge: '💖 Star #7 • Final Closing Star', title: 'Happy New Year 2027, My Love!', text: 'You have completed our 7-star heart! Close this card to watch our midnight fireworks and welcome the first sunrise of 2027 together!', photo: '', x: 84, y: 32 }
];

// Connected perimeter line segments: 1->2->3->4->5->6->7 and looping 7->1
const HEART_LINE_SEGMENTS = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 6, to: 0 } // Closes the entire heart loop!
];

const NY_MAIN_LETTER = {
  badge: '🎆 Happy New Year 2027',
  title: 'Under the Same 2027 Sky, GuGu ✨',
  voiceLabel: 'Listen to my 2027 New Year Voice Message',
  voiceSrc: '',
  body: `Happy New Year 2027, my dearest GuGu! 🎆🌅\n\nAs our 7-star heart shines in the sky and the first peach-gold dawn of 2027 rises on the horizon, my first wish of the year belongs completely to you.\n\nNo matter where my ship sails this year, every star I see at night and every wave that touches the shore reminds me of coming home to you. Stay happy, stay safe, and know that OneOne loves you endlessly—today, tomorrow, and through all of 2027.\n\nForever yours,\nOneOne ❤️`
};

const NY_STATE = { connectedCount: 0, finaleTriggered: false };

const starsLayer = document.getElementById('starsLayer');
const constellationLinesGroup = document.getElementById('constellationLinesGroup');
const heartPolygonFill = document.getElementById('heartPolygonFill');
const nyProgressText = document.getElementById('nyProgressText');
const nyLetterReveal = document.getElementById('nyLetterReveal');
const nyLetterBtn = document.getElementById('nyLetterBtn');
const launchFireworkBtn = document.getElementById('launchFireworkBtn');
const sunriseOverlay = document.getElementById('sunriseOverlay');

function renderNYConstellation() {
  if (!starsLayer || !constellationLinesGroup) return;
  starsLayer.innerHTML = '';
  constellationLinesGroup.innerHTML = '';

  // Draw SVG lines for each connected segment up to connectedCount
  for (let i = 0; i < NY_STATE.connectedCount; i++) {
    if (i >= HEART_LINE_SEGMENTS.length) break;
    const seg = HEART_LINE_SEGMENTS[i];
    const sA = NY_STARS[seg.from];
    const sB = NY_STARS[seg.to];

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sA.x);
    line.setAttribute('y1', sA.y);
    line.setAttribute('x2', sB.x);
    line.setAttribute('y2', sB.y);
    line.setAttribute('class', 'constellation-line');
    constellationLinesGroup.appendChild(line);
  }

  // Render the 7 Star Nodes
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
    btn.setAttribute('aria-label', star.badge);

    btn.addEventListener('click', (e) => handleStarTap(index, star, e));
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

function handleStarTap(index, star, event) {
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

  // Play ascending crystal chime pitch
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
  }

  openMiniCardModal(star);
}

// Trigger Grand Finale when closing the 7th Star's modal
if (miniCardCloseBtn) {
  miniCardCloseBtn.addEventListener('click', () => {
    if (
      APP_STATE.activeScene === 'newyear' &&
      APP_STATE.nyUnlocked &&
      NY_STATE.connectedCount >= 7 &&
      !NY_STATE.finaleTriggered
    ) {
      NY_STATE.finaleTriggered = true;
      trigger2027GrandFinale();
    }
  });
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
   10. BACKGROUND MUSIC (BGM) TOGGLE & AUDIO DUCKING
   ========================================================================== */
const BGM_CONFIG = { src: '', normalVolume: 0.5, duckedVolume: 0.12 };
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

activeVoiceAudio.addEventListener('play', () => { if (isBgmPlaying) bgmAudio.volume = BGM_CONFIG.duckedVolume; });
activeVoiceAudio.addEventListener('pause', () => { if (isBgmPlaying) bgmAudio.volume = BGM_CONFIG.normalVolume; });
activeVoiceAudio.addEventListener('ended', () => { if (isBgmPlaying) bgmAudio.volume = BGM_CONFIG.normalVolume; });

// Initialize App
resizeCanvas();
initParticles();
initSceneFromUrl();
updateCountdowns();
setInterval(updateCountdowns, 1000);
requestAnimationFrame(renderCanvas);
renderNYConstellation();