SELECT tp.team_id, tp.player_id, t.position, tp.win, tp.xp as gained_xp
FROM team t
LEFT JOIN team_player tp ON t.id = tp.team_id
WHERE t.game_id = ${gameId}
ORDER BY t.position, tp.team_id;