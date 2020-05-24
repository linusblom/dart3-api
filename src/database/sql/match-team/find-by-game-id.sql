SELECT mt.id, mt.match_id, mt.team_id, mt.sets, mt.legs, mt.score, mt.position, mt.gems, array_agg(tp.player_id ORDER BY tp.id) as player_ids
FROM match_team mt
LEFT JOIN team_player tp ON mt.team_id = tp.team_id
WHERE mt.match_id IN (SELECT id FROM match WHERE game_id = ${gameId})
GROUP BY mt.id
ORDER BY mt.id;