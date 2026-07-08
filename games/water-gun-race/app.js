const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const TEAM_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#FDD835', '#6D4C41', '#5C6BC0', '#00897B',
  '#D81B60', '#3949AB', '#7CB342', '#FF7043', '#26A69A',
];

const SAMPLE_TEAMS = [
  'Mahomes Alone', 'Saquon Deez Nuts', 'Kupp My Life', 'Hurts So Good',
  'Chasing Kelce', 'Lamar Than Ever', 'Diggs Deep', 'Run CMC Run',
];

const HIT_MESSAGES = {
  bullseye: ['BULLSEYE!', 'Dead center!', 'Perfect shot!'],
  hit: ['Direct hit!', 'Nice blast!', 'Soaking it!'],
  miss: ['Missed!', 'Wide left!', 'Sprayed the crowd!'],
};

const CLOWN_LINES = {
  start: ['Aim for the stars!', 'Steady your spray!', 'Here we go!'],
  bullseye: ['BULLSEYE!', 'What a shot!', 'Carnival legend!'],
  wind: ['Hold on tight!', 'Wind incoming!', 'Brace yourselves!'],
  leader: ['What a climb!', 'Neck and neck!', 'Going up!'],
  finish: ['We have a winner!', 'Pick locked in!', 'Top of the tube!'],
};

const FLOAT_OBJECTS = [
  { type: 'duck', icon: '🦆' },
  { type: 'sailboat', icon: '⛵' },
  { type: 'turtle', icon: '🐢' },
  { type: 'beachball', icon: '🏐' },
  { type: 'flamingo', icon: '🦩' },
  { type: 'fish', icon: '🐠' },
  { type: 'swan', icon: '🦢' },
  { type: 'shell', icon: '🐚' },
  { type: 'octopus', icon: '🐙' },
  { type: 'speedboat', icon: '🚤' },
  { type: 'crab', icon: '🦀' },
  { type: 'seal', icon: '🦭' },
  { type: 'whale', icon: '🐳' },
  { type: 'starfish', icon: '⭐' },
  { type: 'palm', icon: '🌴' },
  { type: 'umbrella', icon: '⛱️' },
];

const state = {
  teams: [],
  raceDuration: 30,
  raceActive: false,
  finishOrder: [],
  racers: [],
  animationId: null,
  raceStartTime: 0,
  lastFrameTime: 0,
  lastLeaderIndex: -1,
  lastLeaderAnnounce: 0,
  nextStatusMessage: 0,
  lastPositionRanks: {},
  nextWindGust: 0,
  windActiveUntil: 0,
};

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const startRaceBtn = $('#start-race-btn');
const setupPanel = $('#setup-panel');
const racePanel = $('#race-panel');
const resultsPanel = $('#results-panel');
const raceColumns = $('#race-columns');
const raceStatus = $('#race-status');
const raceTimer = $('#race-timer');
const livePositions = $('#live-positions');
const liveStandings = $('#live-standings');
const draftOrder = $('#draft-order');
const copyOrderBtn = $('#copy-order-btn');
const raceAgainBtn = $('#race-again-btn');
const toast = $('#toast');
const countdownOverlay = $('#countdown-overlay');
const countdownNum = $('#countdown-num');
const windOverlay = $('#wind-overlay');
const carnivalClown = $('#carnival-clown');
const clownBubble = $('#clown-bubble');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickLine(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function placeLabel(pick) {
  if (pick === 1) return '1ST PLACE!';
  if (pick === 2) return '2ND PLACE!';
  if (pick === 3) return '3RD PLACE!';
  return `#${pick} PICK`;
}

function setClownMood(mood, line) {
  if (!carnivalClown || !clownBubble) return;
  carnivalClown.className = `fp-clown clown-${mood}`;
  clownBubble.textContent = line || pickLine(CLOWN_LINES[mood] || CLOWN_LINES.start);
}

function renderTeamList() {
  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startRaceBtn.disabled = true;
    randomizeOrderBtn.disabled = true;
    return;
  }

  teamList.innerHTML = state.teams
    .map(
      (team, i) => `
      <div class="team-item">
        <span class="team-color" style="background:${TEAM_COLORS[i % TEAM_COLORS.length]}"></span>
        <span class="team-name">${escapeHtml(team)}</span>
        <button type="button" class="remove-team-btn" data-team-index="${i}" aria-label="Remove ${escapeHtml(team)}">×</button>
      </div>`
    )
    .join('');

  startRaceBtn.disabled = state.teams.length < 2;
  randomizeOrderBtn.disabled = state.teams.length < 2;
}

function addTeam(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That team is already in the race!');
    return false;
  }
  if (state.teams.length >= 16) {
    showToast('Maximum 16 teams.');
    return false;
  }
  state.teams.push(trimmed);
  renderTeamList();
  return true;
}

function removeTeam(index) {
  state.teams.splice(index, 1);
  renderTeamList();
}

function setTeams(teams) {
  state.teams = [...teams];
  renderTeamList();
}

function gunHTML(size = '') {
  return `
    <div class="squirt-gun ${size}">
      <div class="gun-tank"></div>
      <div class="gun-body"></div>
      <div class="gun-barrel"></div>
      <div class="gun-nozzle"></div>
      <div class="gun-handle"></div>
      <div class="gun-trigger"></div>
    </div>`;
}

function assignFloatObjects(count) {
  const pool = [];
  while (pool.length < count) {
    pool.push(...shuffleArray([...FLOAT_OBJECTS]));
  }
  return pool.slice(0, count);
}

function buildRaceColumns() {
  const total = state.teams.length;
  const floatAssignments = assignFloatObjects(total);
  raceColumns.style.setProperty('--lane-count', total);
  raceColumns.innerHTML = state.teams
    .map(
      (team, i) => {
        const floater = floatAssignments[i];
        return `
      <div class="fp-lane" data-racer-index="${i}">
        <div class="lane-name" title="${escapeHtml(team)}">${escapeHtml(truncateName(team))}</div>
        <div class="lane-3d">
          <div class="lane-finish-announce" id="finish-announce-${i}" aria-live="polite"></div>
          <div class="tube-assembly">
            <div class="tube-cap" aria-hidden="true">
              <div class="finish-bell ${i === 0 ? 'first-bell' : ''}" aria-hidden="true">🏁</div>
            </div>
            <div class="tube">
              <div class="water-fill" id="water-${i}" style="--team-color:${TEAM_COLORS[i % TEAM_COLORS.length]}"></div>
              <div class="water-surface" id="surface-${i}"></div>
              <div class="float-object float-object--${floater.type}" id="marker-${i}" aria-hidden="true">${floater.icon}</div>
            </div>
          </div>
          <div class="lane-platform"></div>
          <div class="tube-base-target" aria-hidden="true">
            <span class="target-ring"></span>
            <span class="target-center"></span>
          </div>
        </div>
        <div class="gun-station">
          <div class="lane-gun">${gunHTML('squirt-gun--lane')}</div>
          <div class="spray-burst" id="spray-${i}" aria-hidden="true"></div>
          <div class="droplets" id="droplets-${i}" aria-hidden="true"></div>
        </div>
      </div>`;
      }
    )
    .join('');
}

function truncateName(name, max = 11) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function getRaceColumn(index) {
  return raceColumns.querySelector(`[data-racer-index="${index}"]`);
}

function initRacers() {
  state.racers = state.teams.map((name, index) => {
    const column = getRaceColumn(index);
    return {
      index,
      name,
      level: 0,
      finished: false,
      speedFactor: 0.85 + Math.random() * 0.45,
      momentum: 0.9 + Math.random() * 0.35,
      momentumTarget: 1,
      nextShot: 0,
      nextMomentumChange: 0,
      surgeUntil: 0,
      slowUntil: 0,
      element: {
        fill: $(`#water-${index}`),
        surface: $(`#surface-${index}`),
        marker: $(`#marker-${index}`),
        announce: $(`#finish-announce-${index}`),
        gun: column?.querySelector('.gun-station .squirt-gun'),
        spray: $(`#spray-${index}`),
        droplets: $(`#droplets-${index}`),
        column,
        tube: column?.querySelector('.tube'),
      },
    };
  });
}

function updateRacerVisual(racer) {
  const pct = Math.min(racer.level, 100);
  if (racer.element.fill) racer.element.fill.style.height = `${pct}%`;
  if (racer.element.surface) racer.element.surface.style.bottom = `${pct}%`;
  if (racer.element.marker) racer.element.marker.style.bottom = `${pct}%`;
}

function spawnDroplets(racer) {
  const host = racer.element.droplets;
  if (!host) return;
  for (let i = 0; i < 5; i += 1) {
    const drop = document.createElement('span');
    drop.className = 'droplet';
    drop.style.left = `${30 + Math.random() * 40}%`;
    drop.style.animationDelay = `${Math.random() * 0.15}s`;
    host.appendChild(drop);
    setTimeout(() => drop.remove(), 600);
  }
}

function triggerSpray(racer, type) {
  const { gun, spray, column } = racer.element;
  if (!column) return;

  gun?.classList.add('firing');
  if (spray) spray.className = `spray-burst spray-${type}`;
  column.classList.add('column-hit');
  column.querySelector('.tube-base-target')?.classList.add('target-hit');
  spawnDroplets(racer);

  setTimeout(() => {
    gun?.classList.remove('firing');
    if (spray) spray.className = 'spray-burst';
    column.classList.remove('column-hit');
    column.querySelector('.tube-base-target')?.classList.remove('target-hit');
  }, type === 'bullseye' ? 550 : 400);
}

function showHitPopup(racer, message) {
  const target = racer.element.column?.querySelector('.tube-base-target');
  if (!target) return;
  const popup = document.createElement('span');
  popup.className = 'hit-popup';
  popup.textContent = message;
  target.appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

function updateMomentum(racer, now, deltaMs) {
  if (now >= racer.nextMomentumChange) {
    const roll = Math.random();
    if (roll < 0.32) {
      racer.momentumTarget = 1.35 + Math.random() * 0.55;
      racer.surgeUntil = now + 1000 + Math.random() * 1400;
      racer.element.column?.classList.add('surging');
    } else if (roll < 0.52) {
      racer.momentumTarget = 0.4 + Math.random() * 0.35;
      racer.element.column?.classList.remove('surging');
    } else {
      racer.momentumTarget = 0.8 + Math.random() * 0.55;
      racer.element.column?.classList.remove('surging');
    }
    racer.nextMomentumChange = now + 900 + Math.random() * 1800;
  }

  if (now >= racer.surgeUntil) {
    racer.element.column?.classList.remove('surging');
  }

  const lerpRate = 0.06 * (deltaMs / 16);
  racer.momentum += (racer.momentumTarget - racer.momentum) * lerpRate;
}

function tryShoot(racer, now) {
  if (racer.finished || now < racer.nextShot) return;

  racer.nextShot = now + 280 + Math.random() * 520;

  const roll = Math.random();
  let type;
  let rise = 0;

  if (roll < 0.1) {
    type = 'miss';
    rise = 0;
    showHitPopup(racer, pickLine(HIT_MESSAGES.miss));
  } else if (roll < 0.28) {
    type = 'bullseye';
    rise = (2.2 + Math.random() * 1.5) * racer.momentum * racer.speedFactor;
    showHitPopup(racer, pickLine(HIT_MESSAGES.bullseye));
    setClownMood('bullseye');
  } else {
    type = 'hit';
    rise = (0.9 + Math.random() * 1.1) * racer.momentum * racer.speedFactor;
    if (Math.random() < 0.2) showHitPopup(racer, pickLine(HIT_MESSAGES.hit));
  }

  if (now < racer.slowUntil) rise *= 0.15;
  else if (now < racer.surgeUntil) rise *= 1.4;

  if (rise > 0) {
    triggerSpray(racer, type);
    racer.level = Math.min(100, racer.level + rise);
    updateRacerVisual(racer);
    if (racer.level >= 100) recordFinish(racer);
  } else {
    racer.element.gun?.classList.add('firing-weak');
    setTimeout(() => racer.element.gun?.classList.remove('firing-weak'), 200);
  }
}

function triggerWindGust(now) {
  const duration = 1800 + Math.random() * 1200;
  state.windActiveUntil = now + duration;
  state.nextWindGust = now + 6000 + Math.random() * 5000;

  windOverlay.classList.remove('hidden');
  racePanel.classList.add('windy');
  setClownMood('wind');
  raceStatus.textContent = '💨 Wind gust! Everyone slows down!';

  state.racers.forEach((racer) => {
    if (racer.finished) return;
    racer.slowUntil = Math.max(racer.slowUntil, now + duration);
    racer.element.column?.querySelector('.lane-3d')?.classList.add('wind-hit');
    setTimeout(
      () => racer.element.column?.querySelector('.lane-3d')?.classList.remove('wind-hit'),
      duration
    );
  });

  setTimeout(() => {
    windOverlay.classList.add('hidden');
    racePanel.classList.remove('windy');
  }, duration);
}

function compareLevel(a, b) {
  const diff = b.level - a.level;
  return diff !== 0 ? diff : a.index - b.index;
}

function getCurrentStandings() {
  const finished = state.finishOrder.map((entry, i) => ({
    index: entry.index,
    name: entry.name,
    level: 100,
    finished: true,
    pick: i + 1,
  }));
  const racing = state.racers
    .filter((r) => !r.finished)
    .sort(compareLevel)
    .map((r) => ({
      index: r.index,
      name: r.name,
      level: r.level,
      finished: false,
    }));
  return [...finished, ...racing];
}

function updateLivePositions() {
  const standings = getCurrentStandings();
  const prevRanks = state.lastPositionRanks;
  const leaderIdx = standings.findIndex((e) => !e.finished);

  livePositions.innerHTML = standings
    .map((entry, i) => {
      const prevRank = prevRanks[entry.index];
      let moveClass = '';
      if (prevRank !== undefined && !entry.finished) {
        if (i < prevRank) moveClass = 'moved-up';
        else if (i > prevRank) moveClass = 'moved-down';
      }
      const leaderClass = i === leaderIdx && leaderIdx !== -1 ? 'leader' : '';
      const finishedClass = entry.finished ? 'finished' : '';
      return `
        <span class="position-chip ${leaderClass} ${finishedClass} ${moveClass}">
          <span class="position-rank">${i + 1}</span>
          ${escapeHtml(truncateName(entry.name, 14))}
        </span>`;
    })
    .join('');

  const newRanks = {};
  standings.forEach((entry, i) => {
    if (!entry.finished) newRanks[entry.index] = i;
  });
  state.lastPositionRanks = newRanks;
}

function updateLiveStandings() {
  liveStandings.innerHTML = state.finishOrder
    .map(
      (entry, i) => `
      <span class="standing-chip">
        <span class="pick-num">#${i + 1}</span>
        ${escapeHtml(truncateName(entry.name, 14))}
      </span>`
    )
    .join('') || '<span class="standing-empty">No finishes yet</span>';
}

function updateLeaderAnnouncement(now) {
  const racing = state.racers.filter((r) => !r.finished).sort(compareLevel);
  if (racing.length < 2) return;

  const leader = racing[0];
  const elapsed = now - state.raceStartTime;

  if (state.lastLeaderIndex === -1 && elapsed > 1200) {
    state.lastLeaderIndex = leader.index;
    return;
  }

  if (
    leader.index !== state.lastLeaderIndex &&
    elapsed > 1800 &&
    now > state.nextStatusMessage &&
    now - state.lastLeaderAnnounce > 2200
  ) {
    state.lastLeaderIndex = leader.index;
    state.lastLeaderAnnounce = now;
    const gap = leader.level - racing[1].level;
    raceStatus.textContent =
      gap < 5
        ? `💦 Neck and neck! ${leader.name} clings to the lead!`
        : `💦 ${leader.name} surges to the top!`;
    setClownMood('leader');
    state.nextStatusMessage = now + 2200;
  }
}

function showFinishAnnounce(racer, pick) {
  const announce = racer.element.announce;
  if (!announce) return;
  announce.textContent = placeLabel(pick);
  announce.classList.remove('visible', 'place-gold', 'place-silver', 'place-bronze');
  void announce.offsetWidth;
  announce.classList.add('visible');
  if (pick === 1) announce.classList.add('place-gold');
  else if (pick === 2) announce.classList.add('place-silver');
  else if (pick === 3) announce.classList.add('place-bronze');
}

function recordFinish(racer) {
  if (racer.finished) return;

  const pick = state.finishOrder.length + 1;
  state.finishOrder.push({ name: racer.name, index: racer.index });
  racer.finished = true;
  racer.level = 100;
  updateRacerVisual(racer);
  racer.element.column?.classList.add('finished');
  racer.element.column?.classList.remove('surging');
  racer.element.column?.querySelector('.lane-3d')?.classList.remove('wind-hit');
  showFinishAnnounce(racer, pick);

  if (pick === 1) {
    document.querySelector('.first-bell')?.classList.add('ringing');
    raceStatus.textContent = `🏁 ${racer.name} hits the top — Pick #1!`;
    setClownMood('finish', `${racer.name} wins #1!`);
    spawnConfetti();
  } else {
    raceStatus.textContent = `🎆 ${racer.name} hits the top — Pick #${pick}!`;
  }

  spawnFireworks(racer, pick);

  updateLiveStandings();
  updateLivePositions();
}

function spawnFireworks(racer, pick) {
  const tube = racer.element.tube;
  const stage = document.querySelector('.race-stage');
  if (!tube || !stage) return;

  const tubeRect = tube.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const burstX = tubeRect.left + tubeRect.width / 2 - stageRect.left;
  const burstY = tubeRect.top - stageRect.top - 6;
  const colors = [
    TEAM_COLORS[racer.index % TEAM_COLORS.length],
    '#f5c842',
    '#e53935',
    '#fff',
    '#4fc3f7',
  ];
  const particleCount = pick === 1 ? 28 : 16;
  const burstCount = pick === 1 ? 3 : 2;

  for (let b = 0; b < burstCount; b += 1) {
    const burst = document.createElement('div');
    burst.className = 'firework-burst';
    burst.style.left = `${burstX + (Math.random() - 0.5) * 18}px`;
    burst.style.top = `${burstY + (Math.random() - 0.5) * 10}px`;
    burst.style.animationDelay = `${b * 0.12}s`;
    stage.appendChild(burst);

    for (let i = 0; i < particleCount; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'firework-particle';
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.4;
      const dist = 28 + Math.random() * (pick === 1 ? 52 : 36);
      particle.style.setProperty('--fx', `${Math.cos(angle) * dist}px`);
      particle.style.setProperty('--fy', `${Math.sin(angle) * dist}px`);
      particle.style.background = colors[i % colors.length];
      particle.style.animationDelay = `${b * 0.12 + Math.random() * 0.08}s`;
      burst.appendChild(particle);
    }

    setTimeout(() => burst.remove(), 1600);
  }
}

function spawnConfetti() {
  const stage = document.querySelector('.race-stage');
  if (!stage) return;
  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = TEAM_COLORS[i % TEAM_COLORS.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    stage.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}

function finalizeRemaining() {
  state.racers.filter((r) => !r.finished).sort(compareLevel).forEach(recordFinish);
}

function updateTimer(remainingMs) {
  const remainingSec = remainingMs / 1000;
  raceTimer.textContent = formatTime(remainingSec);
  raceTimer.classList.toggle('urgent', remainingSec <= 5 && remainingSec > 0);
}

function endRace() {
  state.raceActive = false;
  if (state.animationId) cancelAnimationFrame(state.animationId);
  finalizeRemaining();
  showResults();
}

function showResults() {
  draftOrder.innerHTML = state.finishOrder
    .map(
      (entry, i) => `
      <li>
        <span class="pick-badge">#${i + 1}</span>
        <span>${escapeHtml(entry.name)}</span>
      </li>`
    )
    .join('');

  racePanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

function raceFrame(timestamp) {
  if (!state.raceActive) return;

  try {
    const now = timestamp || performance.now();
    const deltaMs = Math.min(now - state.lastFrameTime, 50);
    state.lastFrameTime = now;

    const elapsed = now - state.raceStartTime;
    const durationMs = state.raceDuration * 1000;
    const remainingMs = Math.max(0, durationMs - elapsed);
    updateTimer(remainingMs);

    if (now >= state.nextWindGust && now > state.windActiveUntil + 500) {
      triggerWindGust(now);
    }

    state.racers.forEach((racer) => {
      if (racer.finished) return;
      if (racer.nextMomentumChange === 0) {
        racer.nextMomentumChange = now + 400 + Math.random() * 800;
      }
      if (racer.nextShot === 0) {
        racer.nextShot = now + Math.random() * 500;
      }
      updateMomentum(racer, now, deltaMs);
      tryShoot(racer, now);
    });

    updateLivePositions();
    updateLeaderAnnouncement(now);

    if (state.racers.every((r) => r.finished)) {
      endRace();
      return;
    }

    if (remainingMs <= 0) {
      raceStatus.textContent = "⏱️ Time's up! Ranking by height...";
      endRace();
      return;
    }
  } catch (err) {
    console.error('Race frame error:', err);
    state.raceActive = false;
    showToast('Race hit a snag — showing results.');
    endRace();
    return;
  }

  state.animationId = requestAnimationFrame(raceFrame);
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runCountdown() {
  if (!countdownOverlay || !countdownNum) return;
  countdownOverlay.classList.remove('hidden');
  const nums = ['3', '2', '1', 'GO!'];
  for (const num of nums) {
    countdownNum.textContent = num;
    countdownNum.classList.remove('pop');
    void countdownNum.offsetWidth;
    countdownNum.classList.add('pop');
    await wait(num === 'GO!' ? 700 : 850);
  }
  countdownOverlay.classList.add('hidden');
}

async function startRace() {
  if (state.raceActive || !raceColumns) return;

  startRaceBtn.disabled = true;

  try {
    state.finishOrder = [];
    state.lastLeaderIndex = -1;
    state.lastLeaderAnnounce = 0;
    state.nextStatusMessage = 0;
    state.lastPositionRanks = {};
    state.nextWindGust = 0;
    state.windActiveUntil = 0;
    state.raceActive = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);

    buildRaceColumns();
    initRacers();

    if (!state.racers.length || !state.racers[0].element.fill) {
      throw new Error('Race lanes failed to load.');
    }

    state.racers.forEach(updateRacerVisual);
    updateLiveStandings();
    updateLivePositions();

    raceStatus.textContent = 'Get ready to blast!';
    raceTimer.classList.remove('urgent');
    updateTimer(state.raceDuration * 1000);
    windOverlay?.classList.add('hidden');
    racePanel.classList.remove('windy');

    setupPanel.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    racePanel.classList.remove('hidden');

    setClownMood('start');
    await runCountdown();

    state.raceActive = true;
    state.raceStartTime = performance.now();
    state.lastFrameTime = state.raceStartTime;
    state.nextWindGust = state.raceStartTime + 4000 + Math.random() * 3000;
    raceStatus.textContent = '🔫 Blast away! First to the top wins #1!';
    state.animationId = requestAnimationFrame(raceFrame);
  } catch (err) {
    console.error(err);
    showToast('Race failed to start — try again.');
    resetToSetup();
    startRaceBtn.disabled = state.teams.length < 2;
  }
}

function resetToSetup() {
  state.raceActive = false;
  if (state.animationId) cancelAnimationFrame(state.animationId);
  racePanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
  windOverlay?.classList.add('hidden');
  countdownOverlay?.classList.add('hidden');
  startRaceBtn.disabled = state.teams.length < 2;
}

async function handleImport(importFn, ...args) {
  try {
    const result = await importFn(...args);
    if (result.teams?.length) {
      setTeams(result.teams);
      showToast(`Imported ${result.teams.length} teams!`);
    }
  } catch (err) {
    showToast(err.message || 'Import failed.');
  }
}

addTeamBtn.addEventListener('click', () => {
  if (addTeam(teamInput.value)) teamInput.value = '';
});

teamInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (addTeam(teamInput.value)) teamInput.value = '';
  }
});

teamList.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-team-btn');
  if (btn) removeTeam(Number(btn.dataset.teamIndex));
});

randomizeOrderBtn.addEventListener('click', () => {
  if (state.teams.length < 2) return;
  state.teams = shuffleArray(state.teams);
  renderTeamList();
  showToast('Team list shuffled!');
});

sampleTeamsBtn.addEventListener('click', () => setTeams(SAMPLE_TEAMS));

$$('.duration-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.duration-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.raceDuration = Number(btn.dataset.duration);
  });
});

startRaceBtn.addEventListener('click', startRace);
raceAgainBtn.addEventListener('click', resetToSetup);

copyOrderBtn.addEventListener('click', async () => {
  const text = state.finishOrder.map((e, i) => `${i + 1}. ${e.name}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Draft order copied!');
  } catch {
    showToast('Could not copy — try selecting manually.');
  }
});

$$('.import-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.import-tab').forEach((t) => t.classList.remove('active'));
    $$('.import-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $(`[data-platform-panel="${tab.dataset.platform}"]`).classList.add('active');
  });
});

$('#sleeper-import-btn').addEventListener('click', () =>
  handleImport(importSleeperLeague, $('#sleeper-username').value, $('#sleeper-league').value)
);
$('#espn-import-btn').addEventListener('click', () =>
  handleImport(importEspnLeague, $('#espn-league').value, $('#espn-season').value)
);
$('#yahoo-import-btn').addEventListener('click', () =>
  handleImport(importYahooLeague, '', $('#yahoo-teams').value)
);

renderTeamList();
