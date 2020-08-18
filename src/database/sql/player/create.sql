INSERT INTO player (user_id, uid, name, email, color, avatar, pin)
VALUES (${userId}, ${uid}, ${name}, ${email}, ${color}, ${avatar}, crypt(${pin}, gen_salt('bf')))
RETURNING id, uid, name, email, balance, created_at, deleted_at, color, avatar, xp, pro, 0 AS turn_over, 0 AS net