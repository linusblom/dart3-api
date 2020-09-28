SELECT id, debit, credit, balance, start_at, end_at, due_at, paid_at
FROM invoice
WHERE user_id = ${userId} AND paid_at IS NOT NULL