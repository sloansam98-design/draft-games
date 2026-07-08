const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const TEAM_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#FDD835', '#6D4C41', '#5C6BC0', '#00897B',
  '#D81B60', '#3949AB', '#7CB342', '#FF7043', '#26A69A',
];

const FLAIR = ['🏈', '🏆', '⭐', '7️⃣', '🎰', '💎'];

const SAMPLE_TEAMS = [
  'Mahomes Alone', 'Saquon Deez Nuts', 'Kupp My Life', 'Hurts So Good',
  'Chasing Kelce', 'Lamar Than Ever', 'Diggs Deep', 'Run CMC Run',
];

const REEL_ITEM_H = 72;

const state = {
  teams: [],
  remaining: [],
  draftOrder: [],
  isPulling: false,
  pickDirection: 'asc',
  teamColorMap: {},
};

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const startSlotsBtn = $('#start-slots-btn');
const setupPanel = $('#setup-panel');
const slotsPanel = $('#slots-panel');
const resultsPanel = $('#results-panel');
const pullBtn = $('#pull-btn');
const pullPrompt = $('#pull-prompt');
const winnerCallout = $('#winner-callout');
const jackpotBanner = $('#jackpot-banner');
const liveDraftOrder = $('#live-draft-order');
const picksRemaining = $('#picks-remaining');
const finalDraftOrder = $('#final-draft-order');
const copyOrderBtn = $('#copy-order-btn');
const playAgainBtn = $('#play-again-btn');
const toast = $('#toast');
const pickAscBtn = $('#pick-asc-btn');
const pickDescBtn = $('#pick-desc-btn');
const pickAscRange = $('#pick-asc-range');
const pickDescTitle = $('#pick-desc-title');
const pickDescRange = $('#pick-desc-range');
const pickDirectionOptions = $('#pick-direction-options');
const slotMachine = $('#slot-machine');
const slotLever = $('#slot-lever');
const reelEls = [$('#reel-0'), $('#reel-1'), $('#reel-2')];

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

function truncateTeam(name, max = 12) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function getSortedDraftOrder() {
  return [...state.draftOrder].sort((a, b) => a.pick - b.pick);
}

function getNextPickNumber() {
  const assigned = state.draftOrder.length;
  if (state.pickDirection === 'asc') return assigned + 1;
  return state.teams.length - assigned;
}

function updatePickDirectionUI() {
  const n = state.teams.length;
  const lastPick = n >= 2 ? n : 12;
  pickAscRange.textContent = n >= 2 ? `#1 → #${n}` : 'Counts up';
  pickDescTitle.textContent = `#${lastPick} First`;
  pickDescRange.textContent = n >= 2 ? `#${n} → #1` : 'Counts down';
}

function setPickDirection(direction) {
  state.pickDirection = direction;
  pickAscBtn.classList.toggle('active', direction === 'asc');
  pickDescBtn.classList.toggle('active', direction === 'desc');
  pickAscBtn.setAttribute('aria-pressed', direction === 'asc');
  pickDescBtn.setAttribute('aria-pressed', direction === 'desc');
  updatePickDirectionUI();
}

function rebuildColorMap() {
  state.teamColorMap = {};
  state.teams.forEach((team, i) => {
    state.teamColorMap[team] = TEAM_COLORS[i % TEAM_COLORS.length];
  });
}

function renderTeamList() {
  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startSlotsBtn.disabled = true;
    randomizeOrderBtn.disabled = true;
    updatePickDirectionUI();
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

  startSlotsBtn.disabled = state.teams.length < 2;
  randomizeOrderBtn.disabled = state.teams.length < 2;
  rebuildColorMap();
  updatePickDirectionUI();
}

function addTeam(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That team name is already in the machine!');
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

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderItemHTML(item) {
  if (item.type === 'flair') {
    return `<div class="reel-item reel-item--flair"><span class="reel-flair">${item.icon}</span></div>`;
  }
  const color = state.teamColorMap[item.team] || TEAM_COLORS[0];
  return `<div class="reel-item reel-item--team" style="--chip:${color}">
    <span class="reel-chip"></span>
    <span class="reel-name">${escapeHtml(truncateTeam(item.team))}</span>
  </div>`;
}

function buildSpinStrip(remaining, landTeam, { nearMissCount = 0 } = {}) {
  const items = [];
  const cycles = 5 + Math.floor(Math.random() * 4);

  for (let c = 0; c < cycles; c += 1) {
    shuffleArray(remaining).forEach((team) => {
      items.push({ type: 'team', team });
    });
    shuffleArray(FLAIR)
      .slice(0, 2 + Math.floor(Math.random() * 2))
      .forEach((icon) => items.push({ type: 'flair', icon }));
  }

  if (nearMissCount > 0) {
    const decoys = shuffleArray(remaining.filter((t) => t !== landTeam));
    for (let i = 0; i < nearMissCount && decoys.length; i += 1) {
      items.push({ type: 'team', team: decoys[i % decoys.length] });
    }
  } else {
    const others = remaining.filter((t) => t !== landTeam);
    if (others.length && Math.random() < 0.6) {
      items.push({ type: 'team', team: others[Math.floor(Math.random() * others.length)] });
    }
  }

  items.push({ type: 'team', team: landTeam, land: true });
  items.push({ type: 'flair', icon: FLAIR[Math.floor(Math.random() * FLAIR.length)] });
  items.push({ type: 'flair', icon: '🎰' });

  return items;
}

function pickDecoy(remaining, exclude = []) {
  const pool = remaining.filter((t) => !exclude.includes(t));
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  return remaining.find((t) => t !== exclude[0]) || remaining[0];
}

function getLandIndex(items) {
  return items.findIndex((item) => item.land);
}

function setStripPosition(stripEl, index, animate = false) {
  const y = -(index * REEL_ITEM_H) + REEL_ITEM_H;
  stripEl.style.transition = animate ? '' : 'none';
  stripEl.style.transform = `translateY(${y}px)`;
  if (!animate) void stripEl.offsetWidth;
}

function renderIdleReels() {
  const used = [];
  reelEls.forEach((reel) => {
    const landTeam = pickDecoy(state.remaining, used);
    used.push(landTeam);
    const strip = buildSpinStrip(state.remaining, landTeam);
    reel.innerHTML = strip.map(renderItemHTML).join('');
    reel.classList.remove('reel-landed', 'reel-winner', 'reel-matched');
    setStripPosition(reel, getLandIndex(strip));
  });
}

function waitTransition(el) {
  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', onEnd);
      resolve();
    };
    el.addEventListener('transitionend', onEnd);
  });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function spinReel(stripEl, items, duration, easing) {
  const landIndex = getLandIndex(items);
  const extraCycles = 2 + Math.floor(Math.random() * 3);
  const finalY = -(landIndex * REEL_ITEM_H) + REEL_ITEM_H;
  const spinY = finalY - extraCycles * items.length * REEL_ITEM_H;

  stripEl.style.transition = `transform ${duration}s ${easing}`;
  stripEl.style.transform = `translateY(${spinY}px)`;
  await waitTransition(stripEl);
  setStripPosition(stripEl, landIndex);
}

async function spinReelWithNearMiss(stripEl, items, duration) {
  const landIndex = getLandIndex(items);
  const nearMissIndex = Math.max(0, landIndex - 1);
  const extraCycles = 2 + Math.floor(Math.random() * 3);
  const nearY = -(nearMissIndex * REEL_ITEM_H) + REEL_ITEM_H;
  const spinY = nearY - extraCycles * items.length * REEL_ITEM_H;

  stripEl.style.transition = `transform ${duration * 0.72}s cubic-bezier(0.14, 0.88, 0.22, 1)`;
  stripEl.style.transform = `translateY(${spinY}px)`;
  await waitTransition(stripEl);
  setStripPosition(stripEl, nearMissIndex);

  await wait(350 + Math.floor(Math.random() * 400));

  const finalY = -(landIndex * REEL_ITEM_H) + REEL_ITEM_H;
  stripEl.style.transition = 'transform 0.42s cubic-bezier(0.34, 1.45, 0.48, 1)';
  stripEl.style.transform = `translateY(${finalY}px)`;
  await waitTransition(stripEl);
  setStripPosition(stripEl, landIndex);
}

function buildAlignStrip(fromTeam, winner) {
  const teaser = pickDecoy(state.remaining, [fromTeam, winner]);
  return [
    { type: 'flair', icon: '⭐' },
    { type: 'team', team: fromTeam },
    { type: 'team', team: teaser },
    { type: 'team', team: winner, land: true },
    { type: 'flair', icon: '🏆' },
  ];
}

async function cascadeReelToWinner(stripEl, fromTeam, winner) {
  const strip = buildAlignStrip(fromTeam, winner);
  const fromIndex = 1;
  const landIndex = getLandIndex(strip);

  stripEl.innerHTML = strip.map(renderItemHTML).join('');
  setStripPosition(stripEl, fromIndex);
  await wait(60);

  stripEl.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.35, 0.48, 1)';
  const finalY = -(landIndex * REEL_ITEM_H) + REEL_ITEM_H;
  stripEl.style.transform = `translateY(${finalY}px)`;
  await waitTransition(stripEl);
  setStripPosition(stripEl, landIndex);
}

function renderLiveOrder() {
  liveDraftOrder.innerHTML = getSortedDraftOrder()
    .map(
      (entry) => `
      <li>
        <span class="pick-badge">#${entry.pick}</span>
        <span>${escapeHtml(entry.team)}</span>
      </li>`
    )
    .join('');

  const left = state.remaining.length;
  picksRemaining.textContent =
    left > 0 ? `${left} team${left === 1 ? '' : 's'} left in the machine` : 'All picks assigned!';
}

function updatePullPrompt() {
  const pick = getNextPickNumber();
  pullPrompt.innerHTML = `Pulling for pick <strong>#${pick}</strong>`;
}

function startSlots() {
  state.remaining = [...state.teams];
  state.draftOrder = [];
  state.isPulling = false;

  renderIdleReels();
  renderLiveOrder();
  updatePullPrompt();
  winnerCallout.classList.add('hidden');
  jackpotBanner.classList.add('hidden');
  slotMachine.classList.remove('jackpot');
  pullBtn.disabled = false;

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  slotsPanel.classList.remove('hidden');
}

function finishDraft() {
  finalDraftOrder.innerHTML = getSortedDraftOrder()
    .map(
      (entry) => `
      <li>
        <span class="pick-badge">#${entry.pick}</span>
        <span>${escapeHtml(entry.team)}</span>
      </li>`
    )
    .join('');

  slotsPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

async function pullLever() {
  if (state.isPulling || state.remaining.length === 0) return;

  state.isPulling = true;
  pullBtn.disabled = true;
  winnerCallout.classList.add('hidden');
  jackpotBanner.classList.add('hidden');
  slotMachine.classList.remove('jackpot');
  slotLever.classList.add('pulled');
  slotMachine.classList.add('spinning');

  const winnerIndex = Math.floor(Math.random() * state.remaining.length);
  const winner = state.remaining[winnerIndex];

  let decoy0 = winner;
  let decoy1 = winner;
  let strips;

  if (state.remaining.length === 1) {
    strips = [
      buildSpinStrip(state.remaining, winner),
      buildSpinStrip(state.remaining, winner),
      buildSpinStrip(state.remaining, winner),
    ];
  } else {
    decoy0 = pickDecoy(state.remaining, [winner]);
    decoy1 = pickDecoy(state.remaining, [winner, decoy0]);
    const nearMissCount = Math.min(2 + Math.floor(Math.random() * 2), state.remaining.length - 1);

    strips = [
      buildSpinStrip(state.remaining, decoy0),
      buildSpinStrip(state.remaining, decoy1),
      buildSpinStrip(state.remaining, winner, { nearMissCount }),
    ];
  }

  reelEls.forEach((reel, i) => {
    reel.innerHTML = strips[i].map(renderItemHTML).join('');
    reel.classList.remove('reel-landed', 'reel-winner', 'reel-matched');
    setStripPosition(reel, 0);
  });

  await wait(120);
  slotLever.classList.remove('pulled');

  const spinVariance = () => 0.85 + Math.random() * 0.35;

  await spinReel(reelEls[0], strips[0], 1.25 * spinVariance(), 'cubic-bezier(0.2, 0.8, 0.3, 1)');
  reelEls[0].classList.add('reel-landed');
  await wait(180 + Math.floor(Math.random() * 200));
  await spinReel(reelEls[1], strips[1], 1.45 * spinVariance(), 'cubic-bezier(0.15, 0.85, 0.25, 1)');
  reelEls[1].classList.add('reel-landed');
  await wait(280 + Math.floor(Math.random() * 250));
  await spinReelWithNearMiss(reelEls[2], strips[2], 1.9 * spinVariance());
  reelEls[2].classList.add('reel-landed');

  if (state.remaining.length > 1) {
    await wait(220);
    await cascadeReelToWinner(reelEls[0], decoy0, winner);
    await wait(140);
    await cascadeReelToWinner(reelEls[1], decoy1, winner);
  }

  reelEls.forEach((reel) => reel.classList.add('reel-winner', 'reel-matched'));
  slotMachine.classList.remove('spinning');
  slotMachine.classList.add('jackpot');
  jackpotBanner.classList.remove('hidden');

  const pick = getNextPickNumber();
  state.draftOrder.push({ pick, team: winner });
  state.remaining.splice(winnerIndex, 1);

  winnerCallout.textContent = `🎰 ${winner} hits the jackpot — Pick #${pick}!`;
  winnerCallout.classList.remove('hidden');
  renderLiveOrder();

  await wait(1600);

  if (state.remaining.length === 0) {
    finishDraft();
    return;
  }

  slotMachine.classList.remove('jackpot');
  jackpotBanner.classList.add('hidden');
  renderIdleReels();
  updatePullPrompt();
  state.isPulling = false;
  pullBtn.disabled = false;
  winnerCallout.classList.add('hidden');
}

function resetToSetup() {
  slotsPanel.classList.add('hidden');
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

pickDirectionOptions.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-direction]');
  if (!btn || btn.disabled) return;
  setPickDirection(btn.dataset.direction);
});

startSlotsBtn.addEventListener('click', startSlots);
pullBtn.addEventListener('click', pullLever);
playAgainBtn.addEventListener('click', resetToSetup);

copyOrderBtn.addEventListener('click', async () => {
  const text = getSortedDraftOrder().map((e) => `${e.pick}. ${e.team}`).join('\n');
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
