SELECT p.id, p.name, p.email, p.balance, p.created_at, p.deleted_at, p.color, p.avatar, p.xp, p.pro, SUM(t.bet) - SUM(t.refund) AS turn_over, SUM(t.win) - SUM(t.bet) + SUM(t.refund) AS net
FROM player AS p
LEFT JOIN (
  SELECT player_id,
    SUM(CASE WHEN type = 'bet' THEN debit ELSE 0 END) AS bet,
    SUM(CASE WHEN type = 'refund' THEN credit ELSE 0 END) AS refund,
    SUM(CASE WHEN type = 'win' THEN credit ELSE 0 END) AS win
  FROM transaction
  WHERE type IN ('bet', 'refund', 'win')
  GROUP BY player_id, type
) AS t
ON p.id = t.player_id
WHERE p.id = ${id} AND p.user_id = ${userId} AND p.deleted_at IS NULL
GROUP BY p.id;