UPDATE player
SET pin = crypt(${pin}, gen_salt('bf')), pin_disabled = false
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL