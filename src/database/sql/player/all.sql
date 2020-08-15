SELECT id, uid, name, email, created_at, deleted_at, color, avatar, xp, pro
FROM player
WHERE user_id = ${userId} AND deleted_at IS NULL
