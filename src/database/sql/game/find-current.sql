SELECT id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at
FROM game
WHERE user_id = ${userId} AND ended_at IS NULL;