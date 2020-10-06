SELECT
  (SELECT COALESCE(SUM(balance), 0.00) AS rake FROM invoice WHERE user_id = ${userId} AND paid_at IS NULL),
  (SELECT COALESCE(SUM(balance), 0.00) AS players FROM player WHERE user_id = ${userId} AND deleted_at is NULL),
  (SELECT COALESCE(CAST(SUM(prize_pool) AS NUMERIC(8,2)), 0.00) AS in_play FROM game WHERE user_id = ${userId} AND ended_at is NULL),
  (SELECT COALESCE(SUM(debit) - SUM(credit), 0.00) AS turn_over FROM transaction WHERE type IN ('bet', 'refund') AND player_id IN (SELECT id FROM player WHERE user_id = ${userId}))