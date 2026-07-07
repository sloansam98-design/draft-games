const SLEEPER_API = 'https://api.sleeper.app/v1';
const NFL_SEASONS = ['2026', '2025', '2024'];

async function sleeperFetch(path) {
  const response = await fetch(`${SLEEPER_API}${path}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

function isLeagueId(value) {
  return /^\d{10,20}$/.test(value.trim());
}

function getTeamName(user) {
  const teamName = user.metadata?.team_name?.trim();
  if (teamName) return teamName;
  const displayName = user.display_name?.trim();
  if (displayName) return displayName;
  return user.username?.trim() || null;
}

async function fetchSleeperUser(username) {
  const user = await sleeperFetch(`/user/${encodeURIComponent(username.trim())}`);
  if (!user?.user_id) {
    throw new Error('Sleeper user not found. Check the username and try again.');
  }
  return user;
}

async function fetchLeagueById(leagueId) {
  const league = await sleeperFetch(`/league/${leagueId.trim()}`);
  if (!league?.league_id) {
    throw new Error('League not found. Check the league name or ID.');
  }
  return league;
}

async function findLeagueForUser(userId, leagueQuery) {
  const query = leagueQuery.trim().toLowerCase();

  for (const season of NFL_SEASONS) {
    const leagues = await sleeperFetch(`/user/${userId}/leagues/nfl/${season}`);
    if (!Array.isArray(leagues) || leagues.length === 0) continue;

    const exact = leagues.find((league) => league.name.trim().toLowerCase() === query);
    if (exact) return exact;

    const partial = leagues.find((league) => league.name.trim().toLowerCase().includes(query));
    if (partial) return partial;
  }

  throw new Error(
    'League not found for that user. Try the exact league name or paste the league ID from Sleeper.'
  );
}

async function fetchLeagueTeamNames(leagueId) {
  const users = await sleeperFetch(`/league/${leagueId}/users`);
  if (!Array.isArray(users)) {
    throw new Error('Could not load teams for this league.');
  }

  const teams = users.map(getTeamName).filter(Boolean);
  if (teams.length < 2) {
    throw new Error('This league needs at least 2 teams to run a race.');
  }
  if (teams.length > 20) {
    throw new Error('This league has more than 20 teams. Duck Race supports up to 20.');
  }

  return teams;
}

async function importSleeperLeague(username, leagueQuery) {
  const trimmedLeague = leagueQuery.trim();
  if (!trimmedLeague) {
    throw new Error('Enter your Sleeper league name or league ID.');
  }

  let league;

  if (isLeagueId(trimmedLeague)) {
    league = await fetchLeagueById(trimmedLeague);
  } else {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      throw new Error('Enter your Sleeper username, or paste your league ID instead.');
    }
    const user = await fetchSleeperUser(trimmedUsername);
    league = await findLeagueForUser(user.user_id, trimmedLeague);
  }

  const teams = await fetchLeagueTeamNames(league.league_id);

  return {
    teams,
    leagueName: league.name,
    leagueId: league.league_id,
  };
}
