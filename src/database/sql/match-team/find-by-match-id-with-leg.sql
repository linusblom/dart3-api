SELECT d.id, d.order, d.score, d.gems, d.jackpot_paid, d.position, s.legs, s.sets FROM (
  SELECT mt.id, mt.order, mtl.score, mt.gems, mt.jackpot_paid, mtl.position
  FROM match_team mt
  LEFT JOIN match_team_leg mtl ON mtl.match_team_id = mt.id AND set = ${set} AND leg = ${leg}
  WHERE mt.match_id = ${matchId}
) d
LEFT JOIN (
  SELECT match_team_id,
    COUNT(leg_win) FILTER (WHERE set = ${set} AND leg_win = true) AS legs,
    COUNT(set_win) FILTER (WHERE set_win = true) AS sets
  FROM match_team_leg
  GROUP BY match_team_id
) s ON d.id = s.match_team_id
${orderBy:raw}