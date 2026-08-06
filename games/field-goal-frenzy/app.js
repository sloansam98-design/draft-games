const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const TEAM_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#FDD835', '#6D4C41', '#5C6BC0', '#00897B',
];

const SAMPLE_TEAMS = [
  'Mahomes Alone', 'Saquon Deez Nuts', 'Kupp My Life', 'Hurts So Good',
  'Chasing Kelce', 'Lamar Than Ever', 'Diggs Deep', 'Run CMC Run',
];

const MAKE_BASE = 0.72;

const state = {
  teams: [],
  kickerCustomizations: [],
  expandedCustomizeIndex: -1,
  kicksPerTeam: 5,
  gameActive: false,
  kickers: [],
  kickIndex: 0,
  totalKicks: 0,
  isAnimating: false,
  draftOrder: [],
};

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const startGameBtn = $('#start-game-btn');
const setupPanel = $('#setup-panel');
const gamePanel = $('#game-panel');
const resultsPanel = $('#results-panel');
const kickerLanes = $('#kicker-lanes');
const kickCounter = $('#kick-counter');
const gameStatus = $('#game-status');
const kickAnnounce = $('#kick-announce');
const liveStandings = $('#live-standings');
const fieldScene = $('#field-scene');
const flightBall = $('#flight-ball');
const draftOrder = $('#draft-order');
const copyOrderBtn = $('#copy-order-btn');
const playAgainBtn = $('#play-again-btn');
const toast = $('#toast');
const kickOptionBtns = $$('.option-btn');

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

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getJerseyColor(index) {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}

function getKickerStyle(index) {
  return normalizeKickerStyle(state.kickerCustomizations[index] || DEFAULT_KICKER_STYLE);
}

function syncKickerCustomizations() {
  state.kickerCustomizations = state.teams.map(
    (_, index) => normalizeKickerStyle(state.kickerCustomizations[index] || DEFAULT_KICKER_STYLE)
  );
}

function setKickerStyle(index, key, value) {
  const current = getKickerStyle(index);
  current[key] = value;
  state.kickerCustomizations[index] = current;
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
          >${option.label}</button>`
        )
        .join('')}
    </div>`;
}

function renderTeamList() {
  syncKickerCustomizations();

  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startGameBtn.disabled = true;
    randomizeOrderBtn.disabled = true;
    return;
  }

  teamList.innerHTML = state.teams
    .map((team, i) => {
      const style = getKickerStyle(i);
      const isExpanded = state.expandedCustomizeIndex === i;
      return `
      <div class="team-item ${isExpanded ? 'expanded' : ''}" data-index="${i}">
        <div class="team-item-main">
          <span class="team-kicker-icon">${createMiniKickerSVG(getJerseyColor(i), style, 34)}</span>
          <span class="team-color" style="background:${getJerseyColor(i)}"></span>
          <span class="team-name">${escapeHtml(team)}</span>
          <button type="button" class="customize-team-btn" data-index="${i}">
            ${isExpanded ? 'Done' : 'Style Kicker'}
          </button>
          <button type="button" class="remove-team-btn" data-index="${i}" aria-label="Remove ${escapeHtml(team)}">×</button>
        </div>
        ${
          isExpanded
            ? `
          <div class="team-customize-panel">
            <div class="customize-group">
              <span class="customize-label">Headwear</span>
              ${renderClothingOptions(i, 'hat', HAT_OPTIONS, style.hat)}
            </div>
            <div class="customize-group">
              <span class="customize-label">Accessory</span>
              ${renderClothingOptions(i, 'accessory', ACCESSORY_OPTIONS, style.accessory)}
            </div>
            <div class="customize-group">
              <span class="customize-label">Jersey Style</span>
              ${renderClothingOptions(i, 'outfit', OUTFIT_OPTIONS, style.outfit)}
            </div>
            <div class="customize-preview">
              ${createKickerSVG(getJerseyColor(i), style)}
            </div>
          </div>`
            : ''
        }
      </div>`;
    })
    .join('');

  startGameBtn.disabled = state.teams.length < 2;
  randomizeOrderBtn.disabled = state.teams.length < 2;
}

function addTeam(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That team is already in!');
    return false;
  }
  if (state.teams.length >= 20) {
    showToast('Maximum 20 teams.');
    return false;
  }
  state.teams.push(trimmed);
  state.kickerCustomizations.push({ ...DEFAULT_KICKER_STYLE });
  renderTeamList();
  return true;
}

function removeTeam(index) {
  state.teams.splice(index, 1);
  state.kickerCustomizations.splice(index, 1);
  if (state.expandedCustomizeIndex === index) {
    state.expandedCustomizeIndex = -1;
  } else if (state.expandedCustomizeIndex > index) {
    state.expandedCustomizeIndex -= 1;
  }
  renderTeamList();
}

function setTeams(teams) {
  state.teams = [...teams];
  state.kickerCustomizations = teams.map(() => ({ ...DEFAULT_KICKER_STYLE }));
  state.expandedCustomizeIndex = -1;
  renderTeamList();
}

function getRankedKickers() {
  return [...state.kickers].sort((a, b) => {
    if (b.makes !== a.makes) return b.makes - a.makes;
    if (a.misses !== b.misses) return a.misses - b.misses;
    return a.index - b.index;
  });
}

function renderLiveStandings() {
  const ranked = getRankedKickers();
  liveStandings.innerHTML = ranked
    .map((kicker, rank) => {
      const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
      return `
        <li class="standing-item ${rank < 3 ? 'standing-item--top' : ''}">
          <span class="standing-rank">${medal}</span>
          <span class="standing-name">${escapeHtml(kicker.name)}</span>
          <span class="standing-score">${kicker.makes}/${kicker.attempts}</span>
        </li>`;
    })
    .join('');
}

function getRelativeCenter(el, container) {
  const rect = el.getBoundingClientRect();
  const base = container.getBoundingClientRect();
  return {
    x: rect.left - base.left + rect.width / 2,
    y: rect.top - base.top + rect.height / 2,
  };
}

function getGoalTarget() {
  const posts = fieldScene.querySelector('.goal-posts');
  const rect = posts.getBoundingClientRect();
  const base = fieldScene.getBoundingClientRect();
  return {
    x: rect.left - base.left + rect.width / 2,
    y: rect.top - base.top + rect.height * 0.18,
  };
}

function getMissTarget(side) {
  const posts = fieldScene.querySelector('.goal-posts');
  const rect = posts.getBoundingClientRect();
  const base = fieldScene.getBoundingClientRect();
  const centerX = rect.left - base.left + rect.width / 2;
  const centerY = rect.top - base.top + rect.height * 0.18;
  const wideOffset = rect.width * 0.48;
  return {
    x: centerX + (side === 'left' ? -wideOffset : wideOffset),
    y: centerY + rect.height * 0.06,
  };
}

function buildFieldScene() {
  kickerLanes.innerHTML = state.kickers
    .map((kicker) => {
      const color = getJerseyColor(kicker.index);
      const style = getKickerStyle(kicker.index);
      return `
        <div class="kicker-lane" data-index="${kicker.index}" style="--team-color:${color}">
          <div class="lane-score">
            <span class="lane-makes" data-makes>${kicker.makes}</span>
            <span class="lane-score-label">FG</span>
          </div>
          <div class="lane-field">
            <div class="hash-mark"></div>
            <div class="kick-setup">
              <div class="kicker-player">${createKickerSVG(color, style)}</div>
              <div class="ball-tee">
                <div class="tee-ball" aria-hidden="true"></div>
              </div>
            </div>
          </div>
          <p class="lane-name">${escapeHtml(kicker.name)}</p>
        </div>`;
    })
    .join('');

  state.kickers.forEach((kicker) => {
    kicker.laneEl = kickerLanes.querySelector(`[data-index="${kicker.index}"]`);
    kicker.makesEl = kicker.laneEl.querySelector('[data-makes]');
    kicker.playerEl = kicker.laneEl.querySelector('.kicker-player');
    kicker.teeBallEl = kicker.laneEl.querySelector('.tee-ball');
  });
}

function initKickers() {
  state.kickers = state.teams.map((name, index) => ({
    index,
    name,
    makes: 0,
    attempts: 0,
    misses: 0,
    laneEl: null,
    makesEl: null,
    playerEl: null,
    teeBallEl: null,
  }));
}

function updateKickCounter() {
  kickCounter.textContent = `Kick ${state.kickIndex + 1} of ${state.totalKicks}`;
}

function getNextKickerIndex() {
  return state.kickIndex % state.teams.length;
}

function resolveMake(kicker) {
  const accuracy = MAKE_BASE + (Math.random() - 0.5) * 0.18;
  return Math.random() < accuracy;
}

function showKickAnnounce(text, type) {
  kickAnnounce.textContent = text;
  kickAnnounce.className = `kick-announce kick-announce--${type}`;
  kickAnnounce.classList.remove('hidden');
}

function hideKickAnnounce() {
  kickAnnounce.classList.add('hidden');
}

function setActiveLane(index) {
  $$('.kicker-lane').forEach((lane) => lane.classList.remove('active', 'kicking'));
  const lane = state.kickers[index]?.laneEl;
  if (lane) lane.classList.add('active');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateKick(kicker, isMake) {
  const lane = kicker.laneEl;
  const player = kicker.playerEl;
  const teeBall = kicker.teeBallEl;
  if (!lane || !player || !teeBall) return;

  lane.classList.add('kicking');
  player.classList.add('running');

  await wait(520);

  player.classList.remove('running');
  player.classList.add('kicking');
  await wait(180);

  const start = getRelativeCenter(teeBall, fieldScene);
  const end = isMake
    ? getGoalTarget()
    : getMissTarget(Math.random() > 0.5 ? 'right' : 'left');
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  teeBall.classList.add('hidden');
  flightBall.classList.remove('hidden', 'flying', 'make', 'miss');
  flightBall.style.left = `${start.x}px`;
  flightBall.style.top = `${start.y}px`;
  flightBall.style.setProperty('--fly-dx', `${dx}px`);
  flightBall.style.setProperty('--fly-dy', `${dy}px`);
  void flightBall.offsetWidth;
  flightBall.classList.add('flying', isMake ? 'make' : 'miss');

  await wait(920);

  if (isMake) {
    showKickAnnounce('GOOD!', 'make');
    lane.classList.add('flash-make');
  } else {
    showKickAnnounce('NO GOOD', 'miss');
    lane.classList.add('flash-miss');
  }

  await wait(650);

  lane.classList.remove('kicking', 'flash-make', 'flash-miss');
  player.classList.remove('kicking', 'running');
  player.style.transform = '';
  flightBall.classList.remove('flying', 'make', 'miss');
  flightBall.classList.add('hidden');
  teeBall.classList.remove('hidden');
  hideKickAnnounce();
}

async function processKick() {
  if (!state.gameActive || state.isAnimating) return;
  if (state.kickIndex >= state.totalKicks) {
    endGame();
    return;
  }

  state.isAnimating = true;
  const kickerIdx = getNextKickerIndex();
  const kicker = state.kickers[kickerIdx];

  updateKickCounter();
  setActiveLane(kickerIdx);
  gameStatus.textContent = `${kicker.name} lines up for kick ${Math.floor(state.kickIndex / state.teams.length) + 1}...`;

  await wait(400);

  const isMake = resolveMake(kicker);
  kicker.attempts += 1;
  if (isMake) {
    kicker.makes += 1;
  } else {
    kicker.misses += 1;
  }

  await animateKick(kicker, isMake);

  kicker.makesEl.textContent = kicker.makes;
  renderLiveStandings();

  if (isMake) {
    gameStatus.textContent = `${kicker.name} drills it! ${kicker.makes} for ${kicker.attempts}.`;
  } else {
    gameStatus.textContent = `${kicker.name} pulls it wide. Still ${kicker.makes} for ${kicker.attempts}.`;
  }

  state.kickIndex += 1;
  state.isAnimating = false;

  if (state.kickIndex >= state.totalKicks) {
    await wait(800);
    endGame();
  } else {
    await wait(350);
    processKick();
  }
}

function startGame() {
  if (state.teams.length < 2) return;

  state.gameActive = true;
  state.kickIndex = 0;
  state.totalKicks = state.teams.length * state.kicksPerTeam;
  state.draftOrder = [];
  state.isAnimating = false;

  initKickers();
  buildFieldScene();
  renderLiveStandings();
  updateKickCounter();
  gameStatus.textContent = 'Kickoff! First team stepping up...';

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  gamePanel.classList.remove('hidden');

  processKick();
}

function endGame() {
  state.gameActive = false;
  const ranked = getRankedKickers();

  state.draftOrder = ranked.map((kicker, i) => ({
    pick: i + 1,
    team: kicker.name,
    makes: kicker.makes,
    attempts: kicker.attempts,
  }));

  draftOrder.innerHTML = state.draftOrder
    .map((entry) => {
      const medal = entry.pick === 1 ? '🥇' : entry.pick === 2 ? '🥈' : entry.pick === 3 ? '🥉' : `#${entry.pick}`;
      return `
        <li class="draft-order-item">
          <span class="pick-badge">${medal}</span>
          <span class="draft-team">${escapeHtml(entry.team)}</span>
          <span class="draft-stat">${entry.makes}/${entry.attempts} FG</span>
        </li>`;
    })
    .join('');

  gamePanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

function resetToSetup() {
  gamePanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  setupPanel.classList.remove('hidden');
  hideKickAnnounce();
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
  const removeBtn = e.target.closest('.remove-team-btn');
  if (removeBtn) {
    removeTeam(Number(removeBtn.dataset.index));
    return;
  }

  const customizeBtn = e.target.closest('.customize-team-btn');
  if (customizeBtn) {
    const index = Number(customizeBtn.dataset.index);
    state.expandedCustomizeIndex = state.expandedCustomizeIndex === index ? -1 : index;
    renderTeamList();
    return;
  }

  const styleBtn = e.target.closest('.clothing-btn');
  if (styleBtn) {
    setKickerStyle(
      Number(styleBtn.dataset.index),
      styleBtn.dataset.styleType,
      styleBtn.dataset.styleId
    );
  }
});

randomizeOrderBtn.addEventListener('click', () => {
  if (state.teams.length < 2) return;
  const pairs = state.teams.map((team, index) => ({
    team,
    style: getKickerStyle(index),
  }));
  const shuffled = shuffleArray(pairs);
  state.teams = shuffled.map((pair) => pair.team);
  state.kickerCustomizations = shuffled.map((pair) => ({ ...pair.style }));
  state.expandedCustomizeIndex = -1;
  renderTeamList();
  showToast('Order shuffled!');
});

sampleTeamsBtn.addEventListener('click', () => setTeams(SAMPLE_TEAMS));
startGameBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', resetToSetup);

copyOrderBtn.addEventListener('click', async () => {
  const text = state.draftOrder.map((e) => `${e.pick}. ${e.team}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Draft order copied!');
  } catch {
    showToast('Could not copy.');
  }
});

kickOptionBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    kickOptionBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.kicksPerTeam = Number(btn.dataset.kicks);
  });
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
