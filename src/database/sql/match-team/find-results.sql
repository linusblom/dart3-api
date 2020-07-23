SELECT d.player_ids, s.sets FROM (
  SELECT mt.id, array_agg(tp.player_id ORDER BY tp.id) as player_ids
  FROM match_team mt
  LEFT JOIN team_player tp ON mt.team_id = tp.team_id
  WHERE mt.match_id = ${matchId}
  GROUP BY mt.id
) d
LEFT JOIN (
  SELECT match_team_id,
    COUNT(set_win) FILTER (WHERE set_win = true) AS sets
  FROM match_team_score mts
  GROUP BY match_team_id
) s ON d.id = s.match_team_id
ORDER BY s.sets DESC;