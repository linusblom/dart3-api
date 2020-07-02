SELECT id, uid, type, tournament, team, legs, sets, bet, prize_pool, created_at, started_at, ended_at
FROM game
WHERE id = ${id} AND user_id = ${userId};