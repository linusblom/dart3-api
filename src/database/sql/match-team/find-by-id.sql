SELECT mt.id, mt.match_id, mt.team_id, mt.order, mt.gems, mt.jackpot_paid, array_agg(tp.player_id ORDER BY tp.id) as player_ids
FROM match_team mt
LEFT JOIN team_player tp ON mt.team_id = tp.team_id
WHERE mt.id = ${id}
GROUP BY mt.id