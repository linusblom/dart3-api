SELECT COUNT(mtl.id) as teams_left
FROM match_team_leg mtl
RIGHT JOIN match_team mt ON mt.id = mtl.match_team_id AND mt.match_id = ${matchId}
WHERE set = ${set} AND leg = ${leg} AND mtl.position IS NULL