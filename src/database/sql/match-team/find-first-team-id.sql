SELECT mt.id
FROM match_team mt
RIGHT JOIN match_team_leg mtl ON mt.id = mtl.match_team_id AND mtl.set = ${set} AND mtl.leg = ${leg} AND mtl.position IS NULL
WHERE mt.match_id = ${matchId}
ORDER BY mt.order
LIMIT 1