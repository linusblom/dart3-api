SELECT id, type, tournament, team_size, legs, sets, bet, created_at, started_at, ended_at
FROM game
WHERE id = ${id} AND user_id = ${userId};