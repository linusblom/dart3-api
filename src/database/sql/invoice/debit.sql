WITH g (user_id, amount) AS (SELECT user_id, prize_pool * ${rake:raw} as amount FROM game WHERE id = ${gameId})
INSERT INTO invoice AS i (user_id, debit, balance)
SELECT user_id, amount, amount FROM g
ON CONFLICT ON CONSTRAINT invoice_user_id_start_at_key DO
UPDATE SET debit = i.debit + (SELECT amount FROM g), balance = i.balance + (SELECT amount FROM g)
WHERE i.user_id = (SELECT user_id FROM g) AND CURRENT_DATE BETWEEN i.start_at AND i.end_at