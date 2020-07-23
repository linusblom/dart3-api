SELECT d.id, d.score, d.gems, d.jackpot_paid, s.legs, s.sets FROM (
  SELECT mt.id, mts.score, mt.gems, mt.jackpot_paid
  FROM match_team mt
  LEFT JOIN match_team_score mts ON mts.match_team_id = mt.id AND set = ${set} AND leg = ${leg}
  WHERE mt.match_id = ${matchId}
) d
LEFT JOIN (
  SELECT match_team_id,
    COUNT(leg_win) FILTER (WHERE set = ${set} AND leg_win = true) AS legs,
    COUNT(set_win) FILTER (WHERE set_win = true) AS sets
  FROM match_team_score
  GROUP BY match_team_id
) s ON d.id = s.match_team_id
ORDER BY d.score DESC;