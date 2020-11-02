SELECT mt.id, mt.order, mtl.position
FROM match_team mt
LEFT JOIN match_team_leg mtl ON mt.id = mtl.match_team_id AND mtl.set = ${set} AND mtl.leg = ${leg}
WHERE mt.match_id = ${matchId}
ORDER BY CASE WHEN mt.order > ${order} THEN 1 ELSE 2 END, mt.order
