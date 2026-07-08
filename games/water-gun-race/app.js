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
        <button type="button" class="remove-team-btn" data-index="${i}" aria-label="Remove ${escapeHtml(team)}">×</button>
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

function buildRaceColumns() {
  raceColumns.innerHTML = state.teams
    .map(
      (team, i) => `
      <div class="race-column" data-index="${i}">
        <div class="column-name" title="${escapeHtml(team)}">${escapeHtml(truncateName(team))}</div>
        <div class="tube">
          <div class="finish-bell ${i === 0 ? 'first-bell' : ''}" aria-hidden="true">🏁</div>
          <div class="tube-target" aria-hidden="true">
            <span class="target-ring"></span>
            <span class="target-center"></span>
          </div>
          <div class="water-fill" id="water-${i}" style="--team-color:${TEAM_COLORS[i % TEAM_COLORS.length]}"></div>
          <div class="water-surface" id="surface-${i}"></div>
          <div class="team-marker" id="marker-${i}">💧</div>
        </div>
        <div class="gun-station">
          <div class="water-gun" id="gun-${i}">🔫</div>
          <div class="spray-burst" id="spray-${i}" aria-hidden="true"></div>
        </div>
      </div>`
    )
    .join('');
}

function truncateName(name, max = 11) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function initRacers() {
  state.racers = state.teams.map((name, index) => ({
    index,
    name,
    level: 0,
    finished: false,
    speedFactor: 0.75 + Math.random() * 0.5,
    momentum: 0.8 + Math.random() * 0.4,
    momentumTarget: 1,
    nextShot: 0,
    nextMomentumChange: 0,
    surgeUntil: 0,
    slowUntil: 0,
    element: {
      fill: $(`#water-${index}`),
      surface: $(`#surface-${index}`),
      marker: $(`#marker-${index}`),
      gun: $(`#gun-${index}`),
      spray: $(`#spray-${index}`),
      column: document.querySelector(`[data-index="${index}"]`),
    },
  }));
}

function updateRacerVisual(racer) {
  const pct = Math.min(racer.level, 100);
  racer.element.fill.style.height = `${pct}%`;
  racer.element.surface.style.bottom = `${pct}%`;
  racer.element.marker.style.bottom = `${pct}%`;
}

function triggerSpray(racer, type) {
  const { gun, spray, column } = racer.element;
  gun.classList.add('firing');
  spray.className = `spray-burst spray-${type}`;
  column.classList.add('column-hit');
  setTimeout(() => {
    gun.classList.remove('firing');
    spray.className = 'spray-burst';
    column.classList.remove('column-hit');
  }, type === 'bullseye' ? 500 : 380);
}

function showHitPopup(racer, message) {
  const popup = document.createElement('span');
  popup.className = 'hit-popup';
  popup.textContent = message;
  racer.element.column.querySelector('.tube').appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

function updateMomentum(racer, now, deltaMs) {
  if (now >= racer.nextMomentumChange) {
    const roll = Math.random();
    if (roll < 0.3) {
      racer.momentumTarget = 1.3 + Math.random() * 0.5;
      racer.surgeUntil = now + 1000 + Math.random() * 1500;
      racer.element.column.classList.add('surging');
    } else if (roll < 0.55) {
      racer.momentumTarget = 0.35 + Math.random() * 0.35;
      racer.element.column.classList.remove('surging');
    } else {
      racer.momentumTarget = 0.75 + Math.random() * 0.5;
      racer.element.column.classList.remove('surging');
    }
    racer.nextMomentumChange = now + 1000 + Math.random() * 2000;
  }

  if (now >= racer.surgeUntil) {
    racer.element.column.classList.remove('surging');
  }

  const lerpRate = 0.05 * (deltaMs / 16);
  racer.momentum += (racer.momentumTarget - racer.momentum) * lerpRate;
}

function tryShoot(racer, now) {
  if (racer.finished || now < racer.nextShot) return;

  racer.nextShot = now + 350 + Math.random() * 700;

  const roll = Math.random();
  let type;
  let rise = 0;

  if (roll < 0.12) {
    type = 'miss';
    rise = 0;
    const msgs = HIT_MESSAGES.miss;
    showHitPopup(racer, msgs[Math.floor(Math.random() * msgs.length)]);
  } else if (roll < 0.28) {
    type = 'bullseye';
    rise = (1.8 + Math.random() * 1.2) * racer.momentum * racer.speedFactor;
    const msgs = HIT_MESSAGES.bullseye;
    showHitPopup(racer, msgs[Math.floor(Math.random() * msgs.length)]);
  } else {
    type = 'hit';
    rise = (0.6 + Math.random() * 0.9) * racer.momentum * racer.speedFactor;
    if (Math.random() < 0.25) {
      const msgs = HIT_MESSAGES.hit;
      showHitPopup(racer, msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }

  if (now < racer.slowUntil) rise *= 0.2;
  else if (now < racer.surgeUntil) rise *= 1.35;

  if (rise > 0) {
    triggerSpray(racer, type);
    racer.level = Math.min(100, racer.level + rise);
    updateRacerVisual(racer);
    if (racer.level >= 100) recordFinish(racer);
  } else {
    racer.element.gun.classList.add('firing-weak');
    setTimeout(() => racer.element.gun.classList.remove('firing-weak'), 200);
  }
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
      gap < 4
        ? `💦 Neck and neck! ${leader.name} clings to the lead!`
        : `💦 ${leader.name} surges to the top!`;
    state.nextStatusMessage = now + 2200;
  }
}

function recordFinish(racer) {
  if (racer.finished) return;

  const pick = state.finishOrder.length + 1;
  state.finishOrder.push({ name: racer.name, index: racer.index });
  racer.finished = true;
  racer.level = 100;
  updateRacerVisual(racer);
  racer.element.column.classList.add('finished');
  racer.element.column.classList.remove('surging');

  if (pick === 1) {
    document.querySelector('.first-bell')?.classList.add('ringing');
    raceStatus.textContent = `🏁 ${racer.name} hits the top — Pick #1!`;
  }

  updateLiveStandings();
  updateLivePositions();
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

  const now = timestamp || performance.now();
  const deltaMs = Math.min(now - state.lastFrameTime, 50);
  state.lastFrameTime = now;

  const elapsed = now - state.raceStartTime;
  const durationMs = state.raceDuration * 1000;
  const remainingMs = Math.max(0, durationMs - elapsed);
  updateTimer(remainingMs);

  state.racers.forEach((racer) => {
    if (racer.finished) return;
    if (racer.nextMomentumChange === 0) {
      racer.nextMomentumChange = now + 600 + Math.random() * 1200;
    }
    if (racer.nextShot === 0) {
      racer.nextShot = now + Math.random() * 800;
    }
    updateMomentum(racer, now, deltaMs);
    tryShoot(racer, now);
  });

  updateLivePositions();
  updateLeaderAnnouncement(now);

  const allFinished = state.racers.every((r) => r.finished);
  if (allFinished) {
    endRace();
    return;
  }

  if (remainingMs <= 0) {
    raceStatus.textContent = "⏱️ Time's up! Ranking by height...";
    endRace();
    return;
  }

  state.animationId = requestAnimationFrame(raceFrame);
}

function startRace() {
  state.finishOrder = [];
  state.raceActive = true;
  state.lastLeaderIndex = -1;
  state.lastLeaderAnnounce = 0;
  state.nextStatusMessage = 0;
  state.lastPositionRanks = {};

  buildRaceColumns();
  initRacers();
  state.racers.forEach(updateRacerVisual);
  updateLiveStandings();
  updateLivePositions();

  raceStatus.textContent = '🔫 Blast away! First to the top wins #1!';
  raceTimer.classList.remove('urgent');
  updateTimer(state.raceDuration * 1000);

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  racePanel.classList.remove('hidden');

  state.raceStartTime = performance.now();
  state.lastFrameTime = state.raceStartTime;
  state.animationId = requestAnimationFrame(raceFrame);
}

function resetToSetup() {
  state.raceActive = false;
  if (state.animationId) cancelAnimationFrame(state.animationId);
  racePanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
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
  if (btn) removeTeam(Number(btn.dataset.index));
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
