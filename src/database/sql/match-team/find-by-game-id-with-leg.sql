SELECT d.id, d.match_id, d.team_id, d.position, d.gems, d.jackpot_paid, d.score, d.player_ids, s.legs, s.sets FROM (
  SELECT mt.id, mt.match_id, mt.team_id, mtl.position, mt.gems, mt.jackpot_paid, mtl.score, array_agg(tp.player_id ORDER BY tp.id) as player_ids
  FROM match_team mt
  LEFT JOIN team_player tp ON mt.team_id = tp.team_id
  LEFT JOIN match m ON m.id = mt.match_id
  LEFT JOIN match_team_leg mtl ON mt.id = mtl.match_team_id AND mtl.set = m.active_set AND mtl.leg = m.active_leg
  WHERE mt.match_id IN (SELECT id FROM match WHERE game_id = ${gameId})
  GROUP BY mt.id, mtl.score, mtl.position
) d
LEFT JOIN (
  SELECT match_team_id,
    COUNT(leg_win) FILTER (WHERE set = m.active_set AND leg_win = true) AS legs,
    COUNT(set_win) FILTER (WHERE set_win = true) AS sets
  FROM match_team_leg mtl
  LEFT JOIN match_team mt ON mt.id = mtl.match_team_id
  LEFT JOIN match m ON m.id = mt.match_id 
  GROUP BY match_team_id
) s ON d.id = s.match_team_id
ORDER BY d.id