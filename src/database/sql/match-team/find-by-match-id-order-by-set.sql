SELECT mt.id, mt.score, mt.legs, mt.sets, mt.gems, mt.team_id, array_agg(tp.player_id) as player_ids
FROM match_team mt
LEFT JOIN team_player tp ON mt.team_id = tp.team_id
WHERE match_id = ${matchId}
GROUP BY mt.id
ORDER BY sets DESC;