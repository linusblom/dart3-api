SELECT id, uid, name, email, created_at, deleted_at, color, avatar, xp, pro, double, pin_disabled
FROM player
WHERE user_id = ${userId} AND deleted_at IS NULL
