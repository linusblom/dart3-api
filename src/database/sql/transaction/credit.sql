INSERT INTO transaction (player_id, type, credit, balance, description)
SELECT ${playerId}, ${type}, ${amount}, balance + ${amount}, ${description}
FROM transaction
WHERE player_id = ${playerId}
ORDER BY created_at DESC
LIMIT 1
RETURNING id, type, debit, credit, balance, created_at, description;