SELECT COALESCE(SUM(p.balance), 0.00) AS players, COALESCE(SUM(t.turn_over), 0.00) AS turn_over
FROM player AS p
LEFT JOIN 
(
  SELECT player_id, SUM(debit) - SUM(credit) AS turn_over
  FROM transaction
  WHERE type IN ('bet', 'refund')
  GROUP BY player_id
) AS t
ON p.id = t.player_id
WHERE p.user_id = ${userId};