WITH g (balance) AS (
  SELECT balance
  FROM transaction
  WHERE player_id = ${playerId}
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO transaction (player_id, type, debit, balance, description) SELECT ${playerId}, 'system', balance, 0.00, 'Player deleted' FROM g
RETURNING (SELECT balance FROM g)