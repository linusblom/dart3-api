SELECT tp.player_id, tp.team_id, tp.win
FROM team t
LEFT JOIN team_player tp ON t.id = tp.team_id 
WHERE t.game_id = ${gameId} AND t.position = 1
ORDER BY tp.team_id;