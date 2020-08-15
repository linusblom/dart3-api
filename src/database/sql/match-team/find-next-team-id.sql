SELECT mt.id
FROM match_team mt
RIGHT JOIN match_team_leg mtl ON mt.id = mtl.match_team_id AND mtl.set = ${set} AND mtl.leg = ${leg} AND mtl.position IS NULL
WHERE mt.id > ${matchTeamId} AND mt.match_id = ${matchId}
ORDER BY mt.id
LIMIT 1