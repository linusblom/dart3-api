SELECT id, uid, user_id, type, tournament, team, random, legs, sets, bet, prize_pool, check_in, check_out, start_score, tie_break, created_at, started_at, ended_at
FROM game
WHERE user_id = ${userId} AND ended_at IS NULL