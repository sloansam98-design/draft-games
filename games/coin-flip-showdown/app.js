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

const state = {
  teams: [],
  winnersRounds: [],
  losersRounds: null,
  bracketMode: 'winners',
  losersPickRange: null,
  losersLabel: '',
  losersNextPick: 0,
  currentRound: 0,
  currentMatch: 0,
  draftOrder: [],
  isFlipping: false,
  headsTeam: null,
  tailsTeam: null,
};

const teamList = $('#team-list');
const teamInput = $('#team-input');
const addTeamBtn = $('#add-team-btn');
const randomizeOrderBtn = $('#randomize-order-btn');
const sampleTeamsBtn = $('#sample-teams-btn');
const startBracketBtn = $('#start-bracket-btn');
const setupPanel = $('#setup-panel');
const arenaPanel = $('#arena-panel');
const resultsPanel = $('#results-panel');
const roundLabel = $('#round-label');
const matchupLabel = $('#matchup-label');
const teamACard = $('#team-a-card');
const teamBCard = $('#team-b-card');
const teamAName = $('#team-a-name');
const teamBName = $('#team-b-name');
const coin = $('#coin');
const coinResult = $('#coin-result');
const flipBtn = $('#flip-btn');
const winnerCallout = $('#winner-callout');
const bracketView = $('#bracket-view');
const liveDraftOrder = $('#live-draft-order');
const finalDraftOrder = $('#final-draft-order');
const copyOrderBtn = $('#copy-order-btn');
const flipAgainBtn = $('#flip-again-btn');
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

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function nextPowerOf2(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function getRoundName(roundIndex, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIndex;
  if (fromEnd === 0) return 'Championship';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return 'Quarterfinals';
  return `Round ${roundIndex + 1}`;
}

function getActiveRounds() {
  return state.bracketMode === 'losers' ? state.losersRounds : state.winnersRounds;
}

function getLosersPickRange(winnersRoundIndex, totalWinnersRounds, teamCount) {
  const fromFinal = totalWinnersRounds - 1 - winnersRoundIndex;
  if (fromFinal <= 0) return null;

  let low = 3;
  for (let tier = 1; tier < fromFinal; tier += 1) {
    low += 2 ** tier;
  }

  const tierSize = 2 ** fromFinal;
  let high = low + tierSize - 1;
  high = Math.min(high, teamCount);

  if (low > teamCount) return null;

  return { low, high, count: high - low + 1 };
}

function renderTeamList() {
  if (state.teams.length === 0) {
    teamList.innerHTML = '<p class="empty-teams">No teams yet — add some above!</p>';
    startBracketBtn.disabled = true;
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

  startBracketBtn.disabled = state.teams.length < 2;
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

function getSortedDraftOrder() {
  return [...state.draftOrder].sort((a, b) => a.pick - b.pick);
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
}

function assignPick(team, pick) {
  if (!team) return;
  state.draftOrder.push({ pick, team });
}

function buildBracketRounds(teamSlots) {
  const bracketSize = nextPowerOf2(teamSlots.length);
  const slots = [...teamSlots];
  while (slots.length < bracketSize) slots.push(null);

  const round0 = [];
  for (let i = 0; i < bracketSize; i += 2) {
    round0.push({ teamA: slots[i], teamB: slots[i + 1], winner: null });
  }

  const rounds = [round0];
  let matchCount = bracketSize / 2;
  while (matchCount > 1) {
    matchCount /= 2;
    rounds.push(
      Array.from({ length: matchCount }, () => ({
        teamA: null,
        teamB: null,
        winner: null,
      }))
    );
  }
  return rounds;
}

function buildWinnersBracket(teams) {
  return buildBracketRounds(shuffleArray(teams));
}

function buildLosersBracket(teams) {
  return buildBracketRounds(shuffleArray(teams));
}

function getActiveMatch() {
  const rounds = getActiveRounds();
  if (!rounds) return null;

  for (let r = 0; r < rounds.length; r += 1) {
    for (let m = 0; m < rounds[r].length; m += 1) {
      const match = rounds[r][m];
      if (match.winner) continue;
      if (match.teamA || match.teamB) {
        return { round: r, index: m, match, rounds };
      }
    }
  }
  return null;
}

function advanceWinner(rounds, roundIndex, matchIndex, winner) {
  const match = rounds[roundIndex][matchIndex];
  match.winner = winner;

  const nextRound = roundIndex + 1;
  if (nextRound >= rounds.length) return;

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const slot = matchIndex % 2 === 0 ? 'teamA' : 'teamB';
  rounds[nextRound][nextMatchIndex][slot] = winner;
}

function isRoundComplete(rounds, roundIndex) {
  return rounds[roundIndex].every((match) => {
    if (!match.teamA && !match.teamB) return true;
    if (match.teamA && !match.teamB) return Boolean(match.winner);
    if (!match.teamA && match.teamB) return Boolean(match.winner);
    return Boolean(match.winner);
  });
}

function collectLosersFromRound(roundIndex) {
  const losers = [];
  state.winnersRounds[roundIndex].forEach((match) => {
    if (match.winner && match.teamA && match.teamB) {
      losers.push(match.winner === match.teamA ? match.teamB : match.teamA);
    }
  });
  return losers;
}

function resolveByes(rounds) {
  let active = getActiveMatch();
  while (active && active.rounds === rounds) {
    const { match, round, index } = active;
    const hasA = Boolean(match.teamA);
    const hasB = Boolean(match.teamB);

    if (hasA && hasB) break;

    const winner = hasA ? match.teamA : match.teamB;
    advanceWinner(rounds, round, index, winner);
    active = getActiveMatch();
    if (!active || active.rounds !== rounds) break;
  }
}

function startLosersBracket(teams, pickRange, label) {
  const n = teams.length;
  const scopedHigh = Math.min(pickRange.low + n - 1, pickRange.high, state.teams.length);
  const scopedRange = { low: pickRange.low, high: scopedHigh, count: n };

  state.bracketMode = 'losers';
  state.losersPickRange = scopedRange;
  state.losersNextPick = scopedHigh;
  state.losersLabel = label;
  state.losersRounds = buildLosersBracket(teams);
  resolveByes(state.losersRounds);
}

function endLosersBracket() {
  state.bracketMode = 'winners';
  state.losersRounds = null;
  state.losersPickRange = null;
  state.losersLabel = '';
  resolveByes(state.winnersRounds);
}

function tryStartLosersBracket(winnersRoundIndex) {
  const range = getLosersPickRange(winnersRoundIndex, state.winnersRounds.length, state.teams.length);
  if (!range || range.count < 2) return false;

  const losers = collectLosersFromRound(winnersRoundIndex);
  if (losers.length === 1) {
    const soloPick = Math.min(range.high, state.teams.length);
    assignPick(losers[0], soloPick);
    renderLiveOrder();
    return false;
  }
  if (losers.length < 2) return false;

  const label = `${getRoundName(winnersRoundIndex, state.winnersRounds.length)} Losers Bracket`;
  startLosersBracket(losers, range, label);
  return true;
}

function isLosersBracketComplete() {
  if (!state.losersRounds) return true;
  const finalRound = state.losersRounds[state.losersRounds.length - 1];
  return finalRound.length === 1 && Boolean(finalRound[0].winner);
}

function renderBracket() {
  let html = state.winnersRounds
    .map((round, ri) => {
      const matches = round
        .map((match, mi) => {
          const isActive =
            state.bracketMode === 'winners' &&
            state.currentRound === ri &&
            state.currentMatch === mi &&
            !match.winner;
          const cls = match.winner ? 'done' : isActive ? 'active' : '';
          const labelA = match.teamA || '—';
          const labelB = match.teamB || 'BYE';
          const winner = match.winner
            ? `<span class="match-winner"> → ${escapeHtml(match.winner)}</span>`
            : '';
          return `<div class="bracket-match ${cls}">${escapeHtml(labelA)} vs ${escapeHtml(labelB)}${winner}</div>`;
        })
        .join('');
      return `
        <div class="bracket-round">
          <div class="bracket-round-title">${getRoundName(ri, state.winnersRounds.length)}</div>
          ${matches}
        </div>`;
    })
    .join('');

  if (state.losersRounds) {
    html += `<div class="bracket-round bracket-round--losers">
      <div class="bracket-round-title">${escapeHtml(state.losersLabel)}</div>`;
    html += state.losersRounds
      .map((round, lri) =>
        round
          .map((match, mi) => {
            const isActive =
              state.bracketMode === 'losers' &&
              state.currentRound === lri &&
              state.currentMatch === mi &&
              !match.winner;
            const cls = match.winner ? 'done' : isActive ? 'active' : '';
            const winner = match.winner
              ? `<span class="match-winner"> → ${escapeHtml(match.winner)}</span>`
              : '';
            return `<div class="bracket-match ${cls}">${escapeHtml(match.teamA || '—')} vs ${escapeHtml(match.teamB || 'BYE')}${winner}</div>`;
          })
          .join('')
      )
      .join('');
    html += '</div>';
  }

  bracketView.innerHTML = html;
}

function updateArenaUI() {
  const active = getActiveMatch();
  if (!active) return false;

  const { match, round, index } = active;
  state.currentRound = round;
  state.currentMatch = index;

  const rounds = active.rounds;
  const totalInRound = rounds[round].filter((m) => m.teamA || m.teamB).length;
  const doneInRound = rounds[round].filter((m) => m.winner).length;

  if (state.bracketMode === 'losers') {
    roundLabel.textContent = state.losersLabel;
    roundLabel.classList.add('losers');
    matchupLabel.textContent = `Fighting for picks #${state.losersPickRange.low}–#${state.losersPickRange.high} · Flip ${doneInRound + 1} of ${totalInRound}`;
  } else {
    roundLabel.textContent = getRoundName(round, state.winnersRounds.length);
    roundLabel.classList.remove('losers');
    matchupLabel.textContent = `Winners Bracket · Matchup ${doneInRound + 1} of ${totalInRound}`;
  }

  const teamA = match.teamA;
  const teamB = match.teamB;

  if (Math.random() < 0.5) {
    state.headsTeam = teamA;
    state.tailsTeam = teamB;
  } else {
    state.headsTeam = teamB;
    state.tailsTeam = teamA;
  }

  teamAName.textContent = teamA;
  teamBName.textContent = teamB;

  const aIsHeads = state.headsTeam === teamA;
  teamACard.querySelector('.team-card-side').textContent = aIsHeads ? 'Heads' : 'Tails';
  teamBCard.querySelector('.team-card-side').textContent = aIsHeads ? 'Tails' : 'Heads';

  teamACard.classList.remove('winner', 'loser');
  teamBCard.classList.remove('winner', 'loser');
  winnerCallout.classList.add('hidden');
  coinResult.classList.add('hidden');
  coin.className = 'coin';
  flipBtn.disabled = false;

  renderBracket();
  return true;
}

function startShowdown() {
  state.winnersRounds = buildWinnersBracket(state.teams);
  state.losersRounds = null;
  state.bracketMode = 'winners';
  state.draftOrder = [];
  state.isFlipping = false;

  resolveByes(state.winnersRounds);

  setupPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  arenaPanel.classList.remove('hidden');

  if (!updateArenaUI()) {
    finishShowdown();
  }
  renderLiveOrder();
}

function finishShowdown() {
  const champion = state.winnersRounds[state.winnersRounds.length - 1][0].winner;
  if (champion && !state.draftOrder.some((e) => e.pick === 1)) {
    assignPick(champion, 1);
  }

  finalDraftOrder.innerHTML = getSortedDraftOrder()
    .map(
      (entry) => `
      <li>
        <span class="pick-badge">#${entry.pick}</span>
        <span>${escapeHtml(entry.team)}</span>
      </li>`
    )
    .join('');

  arenaPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
}

async function animateCoinFlip(landsHeads) {
  const baseRotations = 4 + Math.floor(Math.random() * 3);
  const endRotation = baseRotations * 360 + (landsHeads ? 0 : 180);

  coin.classList.remove('show-heads', 'show-tails', 'flipping');
  void coin.offsetWidth;
  coin.classList.add('flipping');
  coin.style.transform = `rotateY(${endRotation}deg)`;

  await new Promise((r) => setTimeout(r, 1600));

  coin.classList.remove('flipping');
  coin.classList.add(landsHeads ? 'show-heads' : 'show-tails');
  coin.style.transform = '';

  coinResult.textContent = landsHeads ? 'HEADS!' : 'TAILS!';
  coinResult.classList.remove('hidden');
}

async function flipCoin() {
  if (state.isFlipping) return;

  const active = getActiveMatch();
  if (!active) return;

  const { match, round, index, rounds } = active;
  const teamA = match.teamA;
  const teamB = match.teamB;
  if (!teamA || !teamB) return;

  state.isFlipping = true;
  flipBtn.disabled = true;
  winnerCallout.classList.add('hidden');
  coinResult.classList.add('hidden');
  teamACard.classList.remove('winner', 'loser');
  teamBCard.classList.remove('winner', 'loser');

  const landsHeads = Math.random() < 0.5;
  const winner = landsHeads ? state.headsTeam : state.tailsTeam;
  const loser = winner === teamA ? teamB : teamA;

  await animateCoinFlip(landsHeads);

  if (winner === teamA) {
    teamACard.classList.add('winner');
    teamBCard.classList.add('loser');
  } else {
    teamBCard.classList.add('winner');
    teamACard.classList.add('loser');
  }

  await new Promise((r) => setTimeout(r, 800));

  if (state.bracketMode === 'losers') {
    const loserPick = state.losersNextPick;
    assignPick(loser, loserPick);
    state.losersNextPick -= 1;
    advanceWinner(rounds, round, index, winner);
    renderLiveOrder();

    if (isLosersBracketComplete()) {
      assignPick(winner, state.losersPickRange.low);
      renderLiveOrder();

      winnerCallout.textContent = `${winner} earns pick #${state.losersPickRange.low}! Losers bracket complete.`;
      winnerCallout.classList.remove('hidden');
      await new Promise((r) => setTimeout(r, 1600));

      endLosersBracket();
      state.isFlipping = false;

      if (!updateArenaUI()) {
        finishShowdown();
      }
      return;
    }

    winnerCallout.textContent = `${winner} stays alive! ${loser} gets pick #${loserPick}`;
    winnerCallout.classList.remove('hidden');
    await new Promise((r) => setTimeout(r, 1400));

    resolveByes(state.losersRounds);
    state.isFlipping = false;

    if (!updateArenaUI()) {
      endLosersBracket();
      if (!updateArenaUI()) finishShowdown();
    }
    return;
  }

  const isFinal = round === state.winnersRounds.length - 1;
  advanceWinner(rounds, round, index, winner);

  if (isFinal) {
    assignPick(loser, 2);
    renderLiveOrder();
    winnerCallout.textContent = `🏆 ${winner} wins the showdown — Pick #1! ${loser} gets #2.`;
    winnerCallout.classList.remove('hidden');
    await new Promise((r) => setTimeout(r, 1800));
    finishShowdown();
    return;
  }

  winnerCallout.textContent = `${winner} advances! ${loser} heads to the losers bracket.`;
  winnerCallout.classList.remove('hidden');
  await new Promise((r) => setTimeout(r, 1400));

  if (isRoundComplete(state.winnersRounds, round) && tryStartLosersBracket(round)) {
    state.isFlipping = false;
    if (!updateArenaUI()) finishShowdown();
    return;
  }

  resolveByes(state.winnersRounds);
  state.isFlipping = false;

  if (!updateArenaUI()) {
    finishShowdown();
  }
}

function resetToSetup() {
  arenaPanel.classList.add('hidden');
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
  showToast('Seeds shuffled!');
});

sampleTeamsBtn.addEventListener('click', () => setTeams(SAMPLE_TEAMS));
startBracketBtn.addEventListener('click', startShowdown);
flipBtn.addEventListener('click', flipCoin);
flipAgainBtn.addEventListener('click', resetToSetup);

copyOrderBtn.addEventListener('click', async () => {
  const text = getSortedDraftOrder().map((e) => `${e.pick}. ${e.team}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Draft order copied!');
  } catch {
    showToast('Could not copy.');
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
