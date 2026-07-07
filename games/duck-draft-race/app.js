const LANE_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
  '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#8bc34a',
  '#673ab7', '#ff9800', '#009688', '#795548', '#607d8b',
];

const SAMPLE_TEAMS = [
  'Mahomes Alone',
  'Saquon Deez Nuts',
  'Kupp My Life',
  'Hurts So Good',
  'Chasing Kelce',
  'Lamar Than Ever',
  'Diggs Deep',
  'Run CMC Run',
];

const OBSTACLE_MESSAGES = {
  driftwood: ['Bonk! Driftwood!', 'Splinter slowdown!', 'Log jam!'],
  frog: ['Ribbit! Frog collision!', 'Lily pad trouble!', 'The frog jumped!'],
};

const state = {
  teams: [],
  duckCustomizations: [],
  expandedCustomizeIndex: -1,
  raceDuration: 30,
  raceActive: false,
  finishOrder: [],
  animationId: null,
  ducks: [],
  obstacles: [],
  obstacleIdCounter: 0,
  raceStartTime: 0,
  lastFrameTime: 0,
  lastLeaderIndex: -1,
  lastLeaderAnnounce: 0,
  lastObstacleSpawn: 0,
  lastPositionRanks: {},
  nextStatusMessage: 0,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const startRaceBtn = $('#start-race-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const setupPanel = $('#setup-panel');
const racePanel = $('#race-panel');
const resultsPanel = $('#results-panel');
const raceTrack = $('#race-track');
const raceStatus = $('#race-status');
const raceTimer = $('#race-timer');
const livePositions = $('#live-positions');
const liveStandings = $('#live-standings');
const draftOrder = $('#draft-order');
const copyOrderBtn = $('#copy-order-btn');
const raceAgainBtn = $('#race-again-btn');
const toast = $('#toast');
const durationBtns = $$('.duration-btn');
const sleeperUsername = $('#sleeper-username');
const sleeperLeague = $('#sleeper-league');
const sleeperImportBtn = $('#sleeper-import-btn');
const espnLeague = $('#espn-league');
const espnSeason = $('#espn-season');
const espnImportBtn = $('#espn-import-btn');
const yahooLeague = $('#yahoo-league');
const yahooTeams = $('#yahoo-teams');
const yahooImportBtn = $('#yahoo-import-btn');
const importTabs = $$('.import-tab');
const importPanels = $$('.import-panel');

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
}

function updateTimer(remainingMs) {
  const remainingSec = remainingMs / 1000;
  raceTimer.textContent = formatTime(remainingSec);
  raceTimer.classList.toggle('urgent', remainingSec <= 5 && remainingSec > 0);
}

function getDuckStyle(index) {
  return normalizeDuckStyle(state.duckCustomizations[index] || DEFAULT_DUCK_STYLE);
}

function syncDuckCustomizations() {
  state.duckCustomizations = state.teams.map(
    (_, index) => normalizeDuckStyle(state.duckCustomizations[index] || DEFAULT_DUCK_STYLE)
  );
}

function setDuckStyle(index, key, value) {
  const current = getDuckStyle(index);
  current[key] = value;
  state.duckCustomizations[index] = current;
  renderTeamList();
}

function renderClothingOptions(index, type, options, selectedId) {
  return `
    <div class="clothing-options" role="group" aria-label="Choose ${type}">
      ${options
        .map(
          (option) => `
          <button
            type="button"
            class="clothing-btn ${selectedId === option.id ? 'active' : ''}"
            data-index="${index}"
            data-style-type="${type}"
            data-style-id="${option.id}"
          >${option.label}</button>
        `
        )
        .join('')}
    </div>
  `;
}

function renderTeamList() {
  syncDuckCustomizations();

  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startRaceBtn.disabled = true;
    randomizeOrderBtn.disabled = true;
    return;
  }

  teamList.innerHTML = state.teams
    .map((team, i) => {
      const style = getDuckStyle(i);
      const isExpanded = state.expandedCustomizeIndex === i;
      return `
      <div class="team-item ${isExpanded ? 'expanded' : ''}" data-index="${i}">
        <div class="team-item-main">
          <span class="team-duck-icon">${createMiniDuckSVG(getDuckColor(i), style)}</span>
          <span class="team-color-dot" style="background: ${LANE_COLORS[i % LANE_COLORS.length]}"></span>
          <span class="team-name">${escapeHtml(team)}</span>
          <button type="button" class="customize-team-btn" data-index="${i}">
            ${isExpanded ? 'Done' : 'Style Duck'}
          </button>
          <button type="button" class="remove-team-btn" data-index="${i}" aria-label="Remove ${escapeHtml(team)}">×</button>
        </div>
        ${
          isExpanded
            ? `
          <div class="team-customize-panel">
            <div class="customize-group">
              <span class="customize-label">Hat</span>
              ${renderClothingOptions(i, 'hat', HAT_OPTIONS, style.hat)}
            </div>
            <div class="customize-group">
              <span class="customize-label">Accessory</span>
              ${renderClothingOptions(i, 'accessory', ACCESSORY_OPTIONS, style.accessory)}
            </div>
            <div class="customize-group">
              <span class="customize-label">Outfit</span>
              ${renderClothingOptions(i, 'outfit', OUTFIT_OPTIONS, style.outfit)}
            </div>
            <div class="customize-preview">
              ${createRubberDuckSVG(getDuckColor(i), i + 1, style)}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
    })
    .join('');

  startRaceBtn.disabled = state.teams.length < 2;
  randomizeOrderBtn.disabled = state.teams.length < 2;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeTeamOrder() {
  if (state.teams.length < 2) return;

  const pairs = state.teams.map((team, index) => ({
    team,
    style: getDuckStyle(index),
  }));
  const shuffled = shuffleArray(pairs);

  state.teams = shuffled.map((pair) => pair.team);
  state.duckCustomizations = shuffled.map((pair) => ({ ...pair.style }));
  state.expandedCustomizeIndex = -1;
  renderTeamList();
  showToast('Team order randomized!');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function addTeam(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That team name is already in the race!');
    return false;
  }
  if (state.teams.length >= 20) {
    showToast('Maximum 20 teams per race.');
    return false;
  }
  state.teams.push(trimmed);
  state.duckCustomizations.push({ ...DEFAULT_DUCK_STYLE });
  renderTeamList();
  return true;
}

function removeTeam(index) {
  state.teams.splice(index, 1);
  state.duckCustomizations.splice(index, 1);
  if (state.expandedCustomizeIndex === index) {
    state.expandedCustomizeIndex = -1;
  } else if (state.expandedCustomizeIndex > index) {
    state.expandedCustomizeIndex -= 1;
  }
  renderTeamList();
}

function setTeams(teams) {
  state.teams = [...teams];
  state.duckCustomizations = teams.map(() => ({ ...DEFAULT_DUCK_STYLE }));
  state.expandedCustomizeIndex = -1;
  renderTeamList();
}

function loadSampleTeams() {
  setTeams(SAMPLE_TEAMS);
}

async function runImport(button, importFn, successPrefix = 'Loaded') {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Importing...';

  try {
    const result = await importFn();
    setTeams(result.teams);
    showToast(`${successPrefix} ${result.teams.length} teams from ${result.leagueName}!`);
  } catch (error) {
    showToast(error.message || 'Could not import league.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function handleSleeperImport() {
  if (!sleeperLeague.value.trim()) {
    showToast('Enter your Sleeper league name or league ID.');
    sleeperLeague.focus();
    return;
  }

  await runImport(sleeperImportBtn, () =>
    importSleeperLeague(sleeperUsername.value, sleeperLeague.value)
  );
}

async function handleEspnImport() {
  if (!espnLeague.value.trim()) {
    showToast('Enter your ESPN league ID or league URL.');
    espnLeague.focus();
    return;
  }

  const season = espnSeason.value.trim() || null;
  await runImport(espnImportBtn, () => importEspnLeague(espnLeague.value, season));
}

async function handleYahooImport() {
  if (!yahooTeams.value.trim()) {
    showToast('Paste your Yahoo team names, one per line.');
    yahooTeams.focus();
    return;
  }

  await runImport(yahooImportBtn, () =>
    importYahooLeague(yahooLeague.value, yahooTeams.value)
  );
}

function switchImportTab(platform) {
  importTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.platform === platform);
  });
  importPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.platformPanel === platform);
  });
}

function buildRaceScene() {
  const laneCount = state.teams.length;
  const waterHeight = Math.max(laneCount * 54 + 20, 130);

  raceTrack.innerHTML = `
    <div class="scene-sky">
      <div class="scene-sun"></div>
      <div class="scene-cloud-a"></div>
      <div class="scene-cloud-b"></div>
    </div>
    <div class="scene-hills"></div>
    <div class="scene-grass">
      <div class="scene-bush" style="left: 8%"></div>
      <div class="scene-bush" style="left: 35%"></div>
      <div class="scene-bush" style="left: 62%"></div>
      <div class="scene-bush" style="left: 88%"></div>
    </div>
    <div class="scene-bank"></div>
    <div class="water-course" id="water-course" style="min-height: ${waterHeight}px">
      <div class="water-ripples"></div>
      <div class="obstacle-layer" id="obstacle-layer"></div>
      <div class="finish-gate" id="finish-tape">
        <div class="finish-gate-post finish-gate-post--top"></div>
        <div class="finish-gate-post finish-gate-post--bottom"></div>
        <div class="finish-tape-sheet">
          <div class="finish-tape-panel finish-tape-panel--left">
            <span class="tape-text">FINISH</span>
          </div>
          <div class="finish-tape-panel finish-tape-panel--right">
            <span class="tape-text">FINISH</span>
          </div>
        </div>
      </div>
      ${state.teams
        .map(
          (team, i) => `
        <div class="lane" data-lane="${i}">
          <div class="duck paddling" id="duck-${i}" data-index="${i}">
            <div class="duck-sprite">${createRubberDuckSVG(getDuckColor(i), i + 1, getDuckStyle(i))}</div>
            <span class="duck-name-tag">${escapeHtml(team)}</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

function getTrackMetrics() {
  const waterCourse = document.getElementById('water-course') || raceTrack;
  const trackWidth = waterCourse.offsetWidth;
  const finishOffset = 40;
  const startOffset = 12;
  const raceDistance = trackWidth - finishOffset - startOffset;
  return { trackWidth, finishOffset, startOffset, raceDistance };
}

function positionToPixels(positionPercent) {
  const { raceDistance, startOffset } = getTrackMetrics();
  return startOffset + (positionPercent / 100) * raceDistance;
}

function initDucks() {
  const { startOffset } = getTrackMetrics();
  state.ducks = state.teams.map((team, i) => ({
    index: i,
    name: team,
    position: 0,
    speedFactor: 0.82 + Math.random() * 0.18,
    momentum: 0.85 + Math.random() * 0.3,
    momentumTarget: 1,
    nextMomentumChange: 0,
    slowUntil: 0,
    surgeUntil: 0,
    finished: false,
    element: document.getElementById(`duck-${i}`),
    lane: document.querySelector(`[data-lane="${i}"]`),
  }));

  state.ducks.forEach((duck) => {
    duck.element.style.left = `${startOffset}px`;
  });
}

function updateDuckPosition(duck) {
  const cappedPosition = Math.min(duck.position, 100);
  duck.element.style.left = `${positionToPixels(cappedPosition)}px`;
}

function updateObstaclePosition(obstacle) {
  if (!obstacle.element) return;

  const left = positionToPixels(obstacle.position);
  obstacle.element.style.left = `${left}px`;
  obstacle.element.style.top = `${obstacle.topY}px`;
  obstacle.element.style.transform = 'translate(-50%, -50%)';
}

function createObstacleElement(obstacle) {
  const el = document.createElement('div');
  const motionClass = obstacle.direction === 'down' ? 'falling' : 'rising';
  el.className = `obstacle ${obstacle.type} ${motionClass}`;
  el.dataset.obstacleId = obstacle.id;

  if (obstacle.type === 'driftwood') {
    el.innerHTML = createDriftwoodSVG();
  } else {
    el.innerHTML = createLilyPadSVG();
  }

  const layer = document.getElementById('obstacle-layer');
  layer.appendChild(el);
  obstacle.element = el;
  updateObstaclePosition(obstacle);

  requestAnimationFrame(() => el.classList.add('visible'));
}

function spawnSurpriseObstacle(elapsed) {
  const spawnInterval = 2800 + Math.random() * 3200;
  if (elapsed - state.lastObstacleSpawn < spawnInterval) return;

  const activeDucks = state.ducks.filter((d) => !d.finished);
  if (activeDucks.length === 0) return;

  const waterCourse = document.getElementById('water-course');
  if (!waterCourse) return;

  const waterHeight = waterCourse.offsetHeight;
  const avgPosition =
    activeDucks.reduce((sum, d) => sum + d.position, 0) / activeDucks.length;
  const position = Math.min(
    Math.max(avgPosition - 8 + Math.random() * 28, 10),
    90
  );
  const type = Math.random() < 0.55 ? 'driftwood' : 'frog';
  const direction = Math.random() < 0.5 ? 'up' : 'down';
  const speed = 0.045 + Math.random() * 0.03;

  const obstacle = {
    id: state.obstacleIdCounter++,
    type,
    direction,
    position,
    topY: direction === 'up' ? waterHeight + 24 : -24,
    speed,
    hit: false,
    active: true,
    element: null,
  };

  state.obstacles.push(obstacle);
  createObstacleElement(obstacle);
  state.lastObstacleSpawn = elapsed;
}

function showHitBurst(duck, message) {
  const burst = document.createElement('span');
  burst.className = 'hit-burst';
  burst.textContent = message;
  duck.element.appendChild(burst);
  setTimeout(() => burst.remove(), 900);
}

function hitObstacle(duck, obstacle) {
  if (obstacle.hit || !obstacle.active) return;

  obstacle.hit = true;
  const now = performance.now();
  const slowDuration = obstacle.type === 'frog' ? 1400 + Math.random() * 600 : 900 + Math.random() * 500;
  duck.slowUntil = Math.max(duck.slowUntil, now + slowDuration);
  duck.momentum = Math.min(duck.momentum, 0.35);
  duck.momentumTarget = 0.4 + Math.random() * 0.25;

  duck.element.classList.remove('surge', 'boost');
  duck.element.classList.add('stunned', 'bumped');
  setTimeout(() => duck.element.classList.remove('bumped'), 400);
  setTimeout(() => {
    if (performance.now() >= duck.slowUntil) duck.element.classList.remove('stunned');
  }, slowDuration);

  const messages = OBSTACLE_MESSAGES[obstacle.type];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  showHitBurst(duck, msg);

  if (obstacle.type === 'frog') {
    const frog = obstacle.element.querySelector('.lilypad-frog-art');
    if (frog) frog.classList.add('jumping');
    setTimeout(() => {
      raceStatus.textContent = `🐸 ${duck.name} startled a frog!`;
      state.nextStatusMessage = now + 2000;
    }, 0);
  } else {
    obstacle.element.classList.add('hit');
    setTimeout(() => {
      raceStatus.textContent = `🪵 ${duck.name} hit driftwood!`;
      state.nextStatusMessage = now + 2000;
    }, 0);
  }
}

function checkAllObstacleCollisions() {
  const hitRadius = 4;
  const laneHitRadius = 20;

  state.obstacles.forEach((obstacle) => {
    if (obstacle.hit || !obstacle.active) return;

    state.ducks.forEach((duck) => {
      if (duck.finished) return;

      const duckCenterY = duck.lane.offsetTop + duck.lane.offsetHeight / 2;
      const horizontalHit = Math.abs(duck.position - obstacle.position) < hitRadius;
      const verticalHit = Math.abs(obstacle.topY - duckCenterY) < laneHitRadius;

      if (horizontalHit && verticalHit) {
        hitObstacle(duck, obstacle);
      }
    });
  });
}

function updateObstacles(deltaMs) {
  const waterCourse = document.getElementById('water-course');
  const waterHeight = waterCourse?.offsetHeight || 0;

  state.obstacles.forEach((obstacle) => {
    if (!obstacle.active || obstacle.hit) return;

    if (obstacle.direction === 'up') {
      obstacle.topY -= obstacle.speed * deltaMs;
      if (obstacle.topY < -36) {
        obstacle.active = false;
        obstacle.element?.remove();
        return;
      }
    } else {
      obstacle.topY += obstacle.speed * deltaMs;
      if (obstacle.topY > waterHeight + 36) {
        obstacle.active = false;
        obstacle.element?.remove();
        return;
      }
    }

    updateObstaclePosition(obstacle);
  });
}

function breakFinishTape() {
  const tape = document.getElementById('finish-tape');
  if (tape && !tape.classList.contains('broken')) {
    tape.classList.add('broken');
  }
}

function updateMomentum(duck, now, deltaMs) {
  if (now >= duck.nextMomentumChange) {
    const roll = Math.random();
    if (roll < 0.35) {
      duck.momentumTarget = 1.2 + Math.random() * 0.55;
      duck.surgeUntil = now + 1200 + Math.random() * 1800;
      duck.element.classList.add('surge');
    } else if (roll < 0.65) {
      duck.momentumTarget = 0.25 + Math.random() * 0.35;
      duck.element.classList.remove('surge');
    } else {
      duck.momentumTarget = 0.7 + Math.random() * 0.55;
      duck.element.classList.remove('surge');
    }
    duck.nextMomentumChange = now + 1200 + Math.random() * 2200;
  }

  if (now >= duck.surgeUntil) {
    duck.element.classList.remove('surge');
  }

  const lerpRate = 0.04 * (deltaMs / 16);
  duck.momentum += (duck.momentumTarget - duck.momentum) * lerpRate;
}

function getEffectiveSpeed(duck, now) {
  let speed = duck.speedFactor * duck.momentum;

  if (now < duck.slowUntil) {
    speed *= 0.18;
  } else if (now < duck.surgeUntil) {
    speed *= 1.35;
  }

  return Math.max(0.08, speed);
}

function maybeSplash(duck) {
  if (Math.random() < 0.025) {
    const splash = document.createElement('span');
    splash.className = 'duck-splash';
    duck.element.appendChild(splash);
    setTimeout(() => splash.remove(), 600);
  }
}

function compareRacePosition(a, b) {
  const posDiff = b.position - a.position;
  return posDiff !== 0 ? posDiff : a.index - b.index;
}

function getCurrentStandings() {
  const finished = state.finishOrder.map((entry, i) => ({
    index: entry.index,
    name: entry.name,
    position: 100,
    finished: true,
    pick: i + 1,
  }));
  const racing = state.ducks
    .filter((d) => !d.finished)
    .sort(compareRacePosition)
    .map((d) => ({
      index: d.index,
      name: d.name,
      position: d.position,
      finished: false,
    }));
  return [...finished, ...racing];
}

function updateLivePositions() {
  const standings = getCurrentStandings();
  const prevRanks = state.lastPositionRanks;
  const leaderRank = standings.findIndex((entry) => !entry.finished);

  livePositions.innerHTML = `
    <div class="live-positions-label">Live Standings</div>
    <div class="live-positions-list">
      ${standings
        .map((entry, i) => {
          const prevRank = prevRanks[entry.index];
          let moveClass = '';
          if (prevRank !== undefined && !entry.finished) {
            if (i < prevRank) moveClass = 'moved-up';
            else if (i > prevRank) moveClass = 'moved-down';
          }
          const leaderClass = i === leaderRank && leaderRank !== -1 ? 'leader' : '';
          const finishedClass = entry.finished ? 'finished' : '';
          return `
            <span class="position-chip ${leaderClass} ${finishedClass} ${moveClass}">
              <span class="position-rank">${i + 1}</span>
              ${escapeHtml(entry.name)}
            </span>
          `;
        })
        .join('')}
    </div>
  `;

  const newRanks = {};
  standings.forEach((entry, i) => {
    if (!entry.finished) newRanks[entry.index] = i;
  });
  state.lastPositionRanks = newRanks;
}

function updateLeaderAnnouncement(now) {
  const racing = state.ducks.filter((d) => !d.finished).sort((a, b) => b.position - a.position);
  if (racing.length < 2) return;

  const leader = racing[0];
  const elapsed = now - state.raceStartTime;

  if (state.lastLeaderIndex === -1 && elapsed > 1500) {
    state.lastLeaderIndex = leader.index;
    return;
  }

  if (
    leader.index !== state.lastLeaderIndex &&
    elapsed > 2000 &&
    now > state.nextStatusMessage &&
    now - state.lastLeaderAnnounce > 2500
  ) {
    state.lastLeaderIndex = leader.index;
    state.lastLeaderAnnounce = now;

    const gap = leader.position - racing[1].position;
    if (gap < 2) {
      raceStatus.textContent = `📣 Neck and neck! ${leader.name} clings to the lead!`;
    } else {
      raceStatus.textContent = `📣 ${leader.name} surges into the lead!`;
    }
    state.nextStatusMessage = now + 2500;
  }
}

function updateLiveStandings() {
  liveStandings.innerHTML = state.finishOrder
    .map(
      (entry, i) => `
      <span class="standing-chip">
        <span class="pick-num">${i + 1}</span>
        ${escapeHtml(entry.name)}
      </span>
    `
    )
    .join('');
}

function recordFinish(duck) {
  if (duck.finished) return;

  const pick = state.finishOrder.length + 1;
  state.finishOrder.push({ name: duck.name, index: duck.index });

  duck.finished = true;
  duck.position = 100;
  duck.element.classList.remove('paddling', 'surge', 'stunned', 'boost');
  duck.element.classList.add('finished');
  updateDuckPosition(duck);

  if (pick === 1) breakFinishTape();

  updateLiveStandings();
  updateLivePositions();

  const remaining = state.teams.length - state.finishOrder.length;
  if (remaining > 0 && state.raceActive) {
    const elapsed = performance.now() - state.raceStartTime;
    const remainingMs = Math.max(0, state.raceDuration * 1000 - elapsed);
    raceStatus.textContent = `${duck.name} finishes in pick #${pick}! ${remaining} duck${remaining === 1 ? '' : 's'} still racing...`;
    state.nextStatusMessage = performance.now() + 2500;
    updateTimer(remainingMs);
  }
}

function finalizeRemainingDucks() {
  const unfinished = state.ducks.filter((d) => !d.finished).sort(compareRacePosition);

  unfinished.forEach((duck) => {
    recordFinish(duck);
  });
}

function raceFrame(timestamp) {
  if (!state.raceActive) return;

  const now = timestamp || performance.now();
  const deltaMs = Math.min(now - state.lastFrameTime, 50);
  state.lastFrameTime = now;

  const elapsed = now - state.raceStartTime;
  const durationMs = state.raceDuration * 1000;
  const remainingMs = Math.max(0, durationMs - elapsed);
  const progressPerMs = 100 / durationMs;

  updateTimer(remainingMs);
  spawnSurpriseObstacle(elapsed);
  updateObstacles(deltaMs);
  checkAllObstacleCollisions();

  let allFinished = true;
  const pendingFinishes = [];

  state.ducks.forEach((duck) => {
    if (duck.finished) return;
    allFinished = false;

    if (duck.nextMomentumChange === 0) {
      duck.nextMomentumChange = now + 800 + Math.random() * 1500;
    }

    updateMomentum(duck, now, deltaMs);

    const variance = (Math.random() - 0.5) * 0.12;
    const effectiveSpeed = getEffectiveSpeed(duck, now);
    duck.position += (progressPerMs * effectiveSpeed + variance * progressPerMs) * deltaMs;

    maybeSplash(duck);
    updateDuckPosition(duck);

    if (duck.position >= 100) {
      pendingFinishes.push(duck);
    }
  });

  pendingFinishes.sort(compareRacePosition).forEach(recordFinish);

  updateLivePositions();
  updateLeaderAnnouncement(now);

  if (allFinished || elapsed >= durationMs) {
    if (!allFinished) {
      raceStatus.textContent = "Time's up! Ranking ducks by final position...";
      finalizeRemainingDucks();
    }
    endRace();
    return;
  }

  state.animationId = requestAnimationFrame(raceFrame);
}

function startRace() {
  if (state.teams.length < 2) return;

  state.raceActive = true;
  state.finishOrder = [];
  state.ducks = [];
  state.obstacles = [];
  state.obstacleIdCounter = 0;
  state.lastLeaderIndex = -1;
  state.lastLeaderAnnounce = 0;
  state.lastObstacleSpawn = 800;
  state.lastPositionRanks = {};
  state.nextStatusMessage = 0;

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  racePanel.classList.remove('hidden');
  liveStandings.innerHTML = '';
  livePositions.classList.remove('hidden');
  livePositions.innerHTML = '';
  raceTimer.classList.remove('urgent');
  raceTimer.textContent = formatTime(state.raceDuration);
  raceStatus.textContent = 'On your marks... Get set... QUACK!';

  buildRaceScene();

  requestAnimationFrame(() => {
    initDucks();
    setTimeout(() => {
      state.raceStartTime = performance.now();
      state.lastFrameTime = state.raceStartTime;
      raceStatus.textContent = 'Ducks are paddling — watch out for surprises ahead!';
      state.animationId = requestAnimationFrame(raceFrame);
    }, 800);
  });
}

function endRace() {
  state.raceActive = false;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }

  raceTimer.textContent = '0:00';
  raceTimer.classList.remove('urgent');
  raceStatus.textContent = 'Race complete! Here is your draft order:';

  setTimeout(() => {
    showResults();
  }, 1200);
}

function showResults() {
  racePanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
  livePositions.classList.add('hidden');

  const ordinals = ['1st', '2nd', '3rd'];
  draftOrder.innerHTML = state.finishOrder
    .map((entry, i) => {
      const ordinal = ordinals[i] || `${i + 1}th`;
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🦆';
      return `
        <li style="animation-delay: ${i * 0.08}s">
          <span class="pick-badge">${i + 1}</span>
          <div class="draft-team-info">
            <div class="draft-team-name">${medal} ${escapeHtml(entry.name)}</div>
            <div class="draft-team-sub">${ordinal} overall pick</div>
          </div>
        </li>
      `;
    })
    .join('');

  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function copyDraftOrder() {
  const text = state.finishOrder
    .map((entry, i) => `${i + 1}. ${entry.name}`)
    .join('\n');

  navigator.clipboard.writeText(text).then(
    () => showToast('Draft order copied to clipboard!'),
    () => showToast('Could not copy — try selecting manually.')
  );
}

function raceAgain() {
  resultsPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
  teamInput.focus();
}

durationBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    durationBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.raceDuration = Number(btn.dataset.duration);
  });
});

addTeamBtn.addEventListener('click', () => {
  if (addTeam(teamInput.value)) {
    teamInput.value = '';
    teamInput.focus();
  }
});

teamInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (addTeam(teamInput.value)) {
      teamInput.value = '';
    }
  }
});

teamList.addEventListener('click', (e) => {
  const styleBtn = e.target.closest('.clothing-btn');
  if (styleBtn) {
    setDuckStyle(
      Number(styleBtn.dataset.index),
      styleBtn.dataset.styleType,
      styleBtn.dataset.styleId
    );
    return;
  }

  const customizeBtn = e.target.closest('.customize-team-btn');
  if (customizeBtn) {
    const index = Number(customizeBtn.dataset.index);
    state.expandedCustomizeIndex = state.expandedCustomizeIndex === index ? -1 : index;
    renderTeamList();
    return;
  }

  const btn = e.target.closest('.remove-team-btn');
  if (btn) removeTeam(Number(btn.dataset.index));
});

importTabs.forEach((tab) => {
  tab.addEventListener('click', () => switchImportTab(tab.dataset.platform));
});

sampleTeamsBtn.addEventListener('click', loadSampleTeams);
randomizeOrderBtn.addEventListener('click', randomizeTeamOrder);
sleeperImportBtn.addEventListener('click', handleSleeperImport);
espnImportBtn.addEventListener('click', handleEspnImport);
yahooImportBtn.addEventListener('click', handleYahooImport);
sleeperLeague.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSleeperImport();
  }
});
espnLeague.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleEspnImport();
  }
});
startRaceBtn.addEventListener('click', startRace);
copyOrderBtn.addEventListener('click', copyDraftOrder);
raceAgainBtn.addEventListener('click', raceAgain);

window.addEventListener('resize', () => {
  if (state.ducks.length === 0) return;
  state.ducks.forEach((duck) => updateDuckPosition(duck));
  state.obstacles.forEach((obstacle) => updateObstaclePosition(obstacle));
});

renderTeamList();
teamInput.focus();
