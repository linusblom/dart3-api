SELECT CONCAT(mt.id, '.', h.round) as id, mt.id as match_team_id, h.round, SUM(h.value * h.multiplier) AS score, SUM(h.approved_score) AS approved_score
FROM hit h
RIGHT JOIN match_team mt ON mt.id = h.match_team_id AND mt.match_id = ${matchId} 
WHERE h.set = ${set} AND h.leg = ${leg} AND h.round = ${round}
GROUP BY h.round, h.match_team_id, mt.id
ORDER BY h.round