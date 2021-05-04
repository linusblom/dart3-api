SELECT t.id, t.type, t.debit, t.credit, t.balance, t.created_at, t.description, COUNT(*) OVER() AS total
FROM player p
LEFT JOIN transaction t ON p.id = t.player_id
WHERE p.uid = ${uid} AND p.user_id = ${userId}
ORDER BY created_at DESC
LIMIT ${limit}
OFFSET ${offset}