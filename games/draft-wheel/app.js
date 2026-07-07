const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const SEGMENT_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#FDD835', '#6D4C41', '#5C6BC0', '#00897B',
  '#D81B60', '#3949AB', '#7CB342', '#FF7043', '#26A69A',
];

const SAMPLE_TEAMS = [
  'Mahomes Alone', 'Saquon Deez Nuts', 'Kupp My Life', 'Hurts So Good',
  'Chasing Kelce', 'Lamar Than Ever', 'Diggs Deep', 'Run CMC Run',
];

const state = {
  teams: [],
  remaining: [],
  draftOrder: [],
  currentRotation: 0,
  isSpinning: false,
  pickDirection: 'asc',
};

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const startWheelBtn = $('#start-wheel-btn');
const setupPanel = $('#setup-panel');
const wheelPanel = $('#wheel-panel');
const resultsPanel = $('#results-panel');
const wheelSpinner = $('#wheel-spinner');
const wheelSvg = $('#wheel-svg');
const spinBtn = $('#spin-btn');
const spinPrompt = $('#spin-prompt');
const winnerCallout = $('#winner-callout');
const liveDraftOrder = $('#live-draft-order');
const picksRemaining = $('#picks-remaining');
const finalDraftOrder = $('#final-draft-order');
const copyOrderBtn = $('#copy-order-btn');
const spinAgainBtn = $('#spin-again-btn');
const toast = $('#toast');
const pickAscBtn = $('#pick-asc-btn');
const pickDescBtn = $('#pick-desc-btn');
const pickAscRange = $('#pick-asc-range');
const pickDescTitle = $('#pick-desc-title');
const pickDescRange = $('#pick-desc-range');
const pickDirectionOptions = $('#pick-direction-options');

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

function getSortedDraftOrder() {
  return [...state.draftOrder].sort((a, b) => a.pick - b.pick);
}

function getNextPickNumber() {
  const assigned = state.draftOrder.length;
  if (state.pickDirection === 'asc') {
    return assigned + 1;
  }
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

function renderTeamList() {
  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startWheelBtn.disabled = true;
    randomizeOrderBtn.disabled = true;
    updatePickDirectionUI();
    return;
  }

  teamList.innerHTML = state.teams
    .map(
      (team, i) => `
      <div class="team-item">
        <span class="team-color" style="background:${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}"></span>
        <span class="team-name">${escapeHtml(team)}</span>
        <button type="button" class="remove-team-btn" data-index="${i}" aria-label="Remove ${escapeHtml(team)}">×</button>
      </div>`
    )
    .join('');

  startWheelBtn.disabled = state.teams.length < 2;
  randomizeOrderBtn.disabled = state.teams.length < 2;
  updatePickDirectionUI();
}

function addTeam(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (state.teams.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That team name is already on the wheel!');
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

function drawWheel(teams) {
  const n = teams.length;
  if (n === 0) return;

  const cx = 200;
  const cy = 200;
  const r = 190;
  let svg = '';

  teams.forEach((team, i) => {
    const startAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const endAngle = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    svg += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>`;

    const midAngle = (startAngle + endAngle) / 2;
    const textR = r * 0.62;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const deg = (midAngle * 180) / Math.PI + 90;
    const label = team.length > 14 ? `${team.slice(0, 12)}…` : team;

    svg += `
      <text x="${tx}" y="${ty}" transform="rotate(${deg}, ${tx}, ${ty})"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Outfit, sans-serif" font-size="${n > 10 ? 9 : n > 6 ? 11 : 13}"
        font-weight="600" fill="white" stroke="rgba(0,0,0,0.4)" stroke-width="0.5"
        paint-order="stroke">${escapeHtml(label)}</text>`;
  });

  wheelSvg.innerHTML = svg;
}

function resetWheelRotation() {
  state.currentRotation = 0;
  wheelSpinner.style.transition = 'none';
  wheelSpinner.style.transform = 'rotate(0deg)';
  void wheelSpinner.offsetWidth;
  wheelSpinner.style.transition = '';
}

/** Which segment index is under the fixed top pointer at this rotation? */
function getIndexAtPointer(rotationDeg, total) {
  const segmentAngle = 360 / total;
  const normalized = ((rotationDeg % 360) + 360) % 360;
  let index = Math.round((360 - normalized) / segmentAngle - 0.5);
  index = ((index % total) + total) % total;
  return index;
}

function getRotationForWinner(winnerIndex, total) {
  const segmentAngle = 360 / total;
  const fullSpins = 4 + Math.floor(Math.random() * 3);
  return fullSpins * 360 + (360 - (winnerIndex + 0.5) * segmentAngle);
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
    left > 0 ? `${left} team${left === 1 ? '' : 's'} left on the wheel` : 'All picks assigned!';
}

function updateSpinPrompt() {
  const pick = getNextPickNumber();
  spinPrompt.innerHTML = `Spinning for pick <strong>#${pick}</strong>`;
}

function startWheel() {
  state.remaining = [...state.teams];
  state.draftOrder = [];
  state.currentRotation = 0;
  state.isSpinning = false;

  resetWheelRotation();

  drawWheel(state.remaining);
  renderLiveOrder();
  updateSpinPrompt();
  winnerCallout.classList.add('hidden');
  spinBtn.disabled = false;

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  wheelPanel.classList.remove('hidden');
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

  wheelPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

async function spin() {
  if (state.isSpinning || state.remaining.length === 0) return;

  state.isSpinning = true;
  spinBtn.disabled = true;
  winnerCallout.classList.add('hidden');

  resetWheelRotation();

  const total = state.remaining.length;
  const targetIndex = Math.floor(Math.random() * total);
  const targetRotation = getRotationForWinner(targetIndex, total);

  wheelSpinner.style.transform = `rotate(${targetRotation}deg)`;
  state.currentRotation = targetRotation;

  await new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      wheelSpinner.removeEventListener('transitionend', onEnd);
      resolve();
    };
    wheelSpinner.addEventListener('transitionend', onEnd);
  });

  const winnerIndex = getIndexAtPointer(targetRotation, total);
  const winner = state.remaining[winnerIndex];
  const pick = getNextPickNumber();
  state.draftOrder.push({ pick, team: winner });
  state.remaining.splice(winnerIndex, 1);

  winnerCallout.textContent = `🎉 ${winner} gets pick #${pick}!`;
  winnerCallout.classList.remove('hidden');
  renderLiveOrder();

  await new Promise((r) => setTimeout(r, 1200));

  if (state.remaining.length === 0) {
    finishDraft();
    return;
  }

  drawWheel(state.remaining);
  resetWheelRotation();
  updateSpinPrompt();
  state.isSpinning = false;
  spinBtn.disabled = false;
  winnerCallout.classList.add('hidden');
}

function resetToSetup() {
  wheelPanel.classList.add('hidden');
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

// Event listeners
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

startWheelBtn.addEventListener('click', startWheel);
spinBtn.addEventListener('click', spin);
spinAgainBtn.addEventListener('click', resetToSetup);

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
