SELECT id, type, tournament, team_size, legs, sets, bet, created_at, started_at, ended_at
FROM game
WHERE user_id = ${userId} AND ended_at IS NULL;