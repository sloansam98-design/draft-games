const ESPN_SEASONS = ['2025', '2024', '2023'];
const ESPN_API = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons';

function parseEspnLeagueId(input) {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/leagueId[=:](\d+)/i) || trimmed.match(/leagues\/(\d+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^\d{4,12}$/.test(trimmed)) return trimmed;
  return null;
}

function getEspnTeamName(entry) {
  const team = entry.team || entry;
  if (team.name) return team.name.trim();

  const combined = `${team.location || ''} ${team.nickname || ''}`.trim();
  if (combined) return combined;

  if (team.abbrev) return team.abbrev.trim();
  return null;
}

async function fetchEspnLeague(leagueId, season) {
  const url = `${ESPN_API}/${season}/segments/0/leagues/${leagueId}?view=mTeam`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not reach ESPN. Check the league ID and try again.');
  }

  const data = await response.json();

  if (data.messages?.length) {
    throw new Error(
      'ESPN league is private or not found. Make your league public in ESPN settings, or double-check the league ID.'
    );
  }

  return data;
}

function extractEspnTeams(data) {
  const teams = (data.teams || [])
    .map(getEspnTeamName)
    .filter(Boolean);

  if (teams.length < 2) {
    throw new Error('ESPN league needs at least 2 teams to run a race.');
  }
  if (teams.length > 20) {
    throw new Error('This league has more than 20 teams. Duck Race supports up to 20.');
  }

  return teams;
}

async function importEspnLeague(leagueQuery, seasonHint) {
  const leagueId = parseEspnLeagueId(leagueQuery);
  if (!leagueId) {
    throw new Error('Enter a valid ESPN league ID or paste your ESPN league URL.');
  }

  const seasons = seasonHint
    ? [seasonHint, ...ESPN_SEASONS.filter((s) => s !== seasonHint)]
    : ESPN_SEASONS;

  let lastError = null;

  for (const season of seasons) {
    try {
      const data = await fetchEspnLeague(leagueId, season);
      const teams = extractEspnTeams(data);
      return {
        teams,
        leagueName: data.settings?.name || `ESPN League ${leagueId}`,
        leagueId,
        season,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Could not import ESPN league.');
}
