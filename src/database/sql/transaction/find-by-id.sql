SELECT id, type, debit, credit, balance, created_at, description
FROM transaction
WHERE id = ${id};