SELECT id, team_id, player_id, dart, round, leg, set, value, multiplier, total, gem
FROM hit
WHERE team_id IN (SELECT id FROM team_player WHERE game_id = ${gameId})
ORDER BY set, leg, round, dart;