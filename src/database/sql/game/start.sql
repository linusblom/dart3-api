UPDATE game
SET started_at = current_timestamp, prize_pool = prize_pool - prize_pool * ${fee:raw}, tournament = ${tournament}, team = ${team}, random = ${random}
WHERE id = ${id}