SELECT id, type, tournament, team, legs, sets, bet, created_at, started_at, ended_at
FROM game
WHERE id = ${id} AND user_id = ${userId};