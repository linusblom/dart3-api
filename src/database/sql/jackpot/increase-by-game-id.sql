UPDATE jackpot j SET value = value + g.prize_pool * ${fee:raw}, next_value = next_value + g.prize_pool * ${nextFee:raw}
FROM (SELECT user_id, prize_pool FROM game WHERE id = ${gameId}) AS g
WHERE j.user_id = g.user_id AND won_at IS NULL