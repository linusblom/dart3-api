SELECT mt.id, mt.team_id, mt.position, array_agg(tp.player_id ORDER BY tp.id) as player_ids
FROM match_team mt
LEFT JOIN team_player tp ON mt.team_id = tp.team_id
WHERE match_id = ${matchId}
GROUP BY mt.id
ORDER BY mt.position