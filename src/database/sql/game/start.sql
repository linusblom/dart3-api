UPDATE game
SET started_at = current_timestamp, prize_pool = prize_pool - prize_pool * ${fee:raw}
WHERE id = ${id}
RETURNING id, uid, type, tournament, team, legs, sets, bet, prize_pool, created_at, started_at, ended_at