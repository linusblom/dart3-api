SELECT tp.id, tp.team_id, tp.player_id, tp.game_id, tp.xp, 'pro' = ANY(p.roles) as pro
FROM team_player tp
LEFT JOIN player p ON tp.player_id = p.id
WHERE tp.game_id = ${gameId}