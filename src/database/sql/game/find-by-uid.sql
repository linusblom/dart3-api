SELECT id, uid, user_id, type, tournament, team, random, legs, sets, bet, prize_pool, check_in, check_out, start_score, tie_break, created_at, started_at, ended_at
FROM game
WHERE uid = ${uid} AND user_id = ${userId}