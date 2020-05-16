SELECT id, type, debit, credit, balance, created_at, description
FROM transaction
WHERE player_id = ${playerId}
ORDER BY created_at DESC
LIMIT ${limit};