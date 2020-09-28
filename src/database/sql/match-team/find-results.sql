SELECT d.id, s.sets FROM (
  SELECT mt.id
  FROM match_team mt
  WHERE mt.match_id = ${matchId}
) d
LEFT JOIN (
  SELECT match_team_id,
    COUNT(set_win) FILTER (WHERE set_win = true) AS sets
  FROM match_team_leg
  GROUP BY match_team_id
) s ON d.id = s.match_team_id
ORDER BY s.sets DESC