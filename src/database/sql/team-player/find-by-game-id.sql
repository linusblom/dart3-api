SELECT id, team_id, player_id, game_id, turn, xp, win, gems
FROM team_player
WHERE game_id = ${gameId}