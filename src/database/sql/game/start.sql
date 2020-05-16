UPDATE game
SET started_at = CURRENT_TIMESTAMP, current_team_id = ${currentTeamId}
WHERE id = ${id};