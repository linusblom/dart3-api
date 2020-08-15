SELECT CONCAT(mt.id, '.', h.round) as id, mt.id as team_id, h.round, SUM(h.value * h.multiplier) AS score, SUM(h.approved_score) AS approved_score
FROM hit h
LEFT JOIN match_team mt ON mt.id = h.match_team_id
RIGHT JOIN match m ON m.id = mt.match_id AND m.status = 'playing'
WHERE h.match_team_id IN (${matchTeamsIds:csv}) AND h.set = m.active_set AND h.leg = m.active_leg
GROUP BY h.round, h.match_team_id, mt.id
ORDER BY h.round