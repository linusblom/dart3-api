SELECT id, team_id, player_id, game_id, xp
FROM team_player
WHERE game_id = ${gameId}