WITH g (user_id, amount) AS (SELECT user_id, prize_pool * ${rake:raw} as amount FROM game WHERE id = ${gameId})
INSERT INTO invoice AS i (user_id, balance)
SELECT user_id, amount FROM g
ON CONFLICT ON CONSTRAINT invoice_user_id_start_at_key DO
UPDATE SET balance = i.balance + (SELECT amount FROM g)
WHERE i.user_id = (SELECT user_id FROM g) AND current_date BETWEEN i.start_at AND i.end_at