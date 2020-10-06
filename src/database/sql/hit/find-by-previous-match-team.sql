SELECT mt.id as match_team_id, SUM(h.value * h.multiplier) AS score, SUM(h.approved_score) AS approved_score
FROM hit h
RIGHT JOIN match_team mt ON mt.id = h.match_team_id AND mt.match_id = ${matchId}
WHERE (mt.order < ${order} AND h.set = ${set} AND h.leg = ${leg} AND h.round = ${round}) OR (mt.order > ${order} AND h.set = ${set} AND h.leg = ${leg} AND h.round = ${round} - 1)
GROUP BY h.round, h.match_team_id, mt.id
ORDER BY h.round DESC, h.match_team_id DESC
LIMIT 1;