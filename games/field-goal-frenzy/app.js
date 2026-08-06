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

function renderTeamList() {
  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startGameBtn.disabled = true;
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

function createKickerSVG(jerseyColor) {
  return `
    <svg class="kicker-svg" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="24" cy="10" rx="8" ry="9" fill="${jerseyColor}" stroke="#2a2a2a" stroke-width="1"/>
      <rect x="11" y="8" width="18" height="5" rx="2" fill="#fafafa" opacity="0.9"/>
      <rect x="16" y="18" width="16" height="20" rx="4" fill="${jerseyColor}" stroke="#2a2a2a" stroke-width="1"/>
      <rect x="18" y="22" width="12" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>
      <rect x="13" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="1"/>
      <rect x="24" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="1" class="kicker-kick-leg"/>
      <rect x="10" y="20" width="7" height="5" rx="2" fill="${jerseyColor}" transform="rotate(-28 13 22)"/>
    </svg>`;
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

function buildFieldScene() {
  kickerLanes.innerHTML = state.kickers
    .map((kicker) => {
      const color = TEAM_COLORS[kicker.index % TEAM_COLORS.length];
      return `
        <div class="kicker-lane" data-index="${kicker.index}" style="--team-color:${color}">
          <div class="lane-score">
            <span class="lane-makes" data-makes>${kicker.makes}</span>
            <span class="lane-score-label">FG</span>
          </div>
          <div class="lane-field">
            <div class="hash-mark"></div>
            <div class="kick-setup">
              <div class="kicker-player">${createKickerSVG(color)}</div>
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
  const goal = getGoalTarget();
  const dx = goal.x - start.x;
  const dy = goal.y - start.y;

  teeBall.classList.add('hidden');
  flightBall.classList.remove('hidden', 'flying');
  flightBall.style.left = `${start.x}px`;
  flightBall.style.top = `${start.y}px`;
  flightBall.style.setProperty('--fly-dx', `${dx}px`);
  flightBall.style.setProperty('--fly-dy', `${dy}px`);
  void flightBall.offsetWidth;
  flightBall.classList.add('flying');

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
  flightBall.classList.remove('flying');
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
  const btn = e.target.closest('.remove-team-btn');
  if (btn) removeTeam(Number(btn.dataset.index));
});

randomizeOrderBtn.addEventListener('click', () => {
  if (state.teams.length < 2) return;
  state.teams = shuffleArray(state.teams);
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
