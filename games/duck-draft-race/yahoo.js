function parseYahooLeagueKey(input) {
  const trimmed = input.trim();
  const keyMatch =
    trimmed.match(/football\.fantasysports\.yahoo\.com\/f1\/(\d+)/i) ||
    trimmed.match(/(nfl\.l\.\d+)/i) ||
    trimmed.match(/^(\d{3,8})$/);

  if (!keyMatch) return null;
  if (keyMatch[1].includes('.')) return keyMatch[1];
  return `nfl.l.${keyMatch[1]}`;
}

function parseYahooTeamsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0]
      .split(',')
      .map((team) => team.trim())
      .filter(Boolean);
  }

  return lines.map((line) => line.replace(/^\d+[\).\-\s]+/, '').trim()).filter(Boolean);
}

async function importYahooLeague(leagueQuery, rosterText) {
  const leagueKey = leagueQuery ? parseYahooLeagueKey(leagueQuery) : null;
  const teams = parseYahooTeamsFromText(rosterText);

  if (teams.length < 2) {
    throw new Error(
      'Paste at least 2 Yahoo team names (one per line). Yahoo requires roster paste because their API needs sign-in.'
    );
  }
  if (teams.length > 20) {
    throw new Error('This league has more than 20 teams. Duck Race supports up to 20.');
  }

  const uniqueTeams = [...new Set(teams.map((t) => t.toLowerCase()))];
  if (uniqueTeams.length !== teams.length) {
    throw new Error('Duplicate team names found. Remove duplicates and try again.');
  }

  return {
    teams,
    leagueName: leagueKey ? `Yahoo League ${leagueKey}` : 'Yahoo League',
    leagueKey,
  };
}
