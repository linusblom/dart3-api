UPDATE game
SET started_at = current_timestamp, prize_pool = prize_pool - prize_pool * ${fee:raw}
WHERE id = ${id}
RETURNING id, uid, type, tournament, team, random, legs, sets, bet, prize_pool, check_in, check_out, start_score, tie_break, created_at, started_at, ended_at