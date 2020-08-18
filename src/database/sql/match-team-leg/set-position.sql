UPDATE match_team_leg SET position = (
  SELECT COUNT(mtl.id)
  FROM match_team_leg mtl
  RIGHT JOIN match_team mt ON mt.id = mtl.match_team_id AND mt.match_id = ${matchId}
  WHERE set = ${set} AND leg = ${leg} AND position IS NULL
) WHERE match_team_id = ${matchTeamId} AND set = ${set} AND leg = ${leg}