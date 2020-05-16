SELECT id, team_id, player_id, dart, round, leg, set, value, multiplier, total, gem
FROM hit
WHERE team_id = ${teamId}
ORDER BY set, leg, round, dart;