SELECT id, name FROM player WHERE user_id = ${userId} AND pin = crypt(${pin}, pin) AND 'admin' = ANY(roles) AND deleted_at IS NULL