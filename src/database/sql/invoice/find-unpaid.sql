SELECT id, debit, credit, balance, start_at, end_at, due_at, paid_at
FROM invoice
WHERE user_id = ${userId} AND paid_at IS NULL AND CURRENT_DATE NOT BETWEEN start_at AND end_at