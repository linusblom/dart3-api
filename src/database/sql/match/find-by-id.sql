SELECT id, game_id, status, active_round, active_set, active_leg, active_match_team_id, active_player_id, active_start_order, active_score, stage, created_at, started_at, ended_at 
FROM match_active_player_id
WHERE id = ${id}
