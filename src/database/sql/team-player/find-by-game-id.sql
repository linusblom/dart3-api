SELECT id, team_id, player_id, game_id, turn, xp
FROM team_player
WHERE game_id = ${gameId}