UPDATE jackpot SET value = value + ${value}, next_value = next_value + ${nextValue}
WHERE user_id = ${userId} AND won_at IS NULL