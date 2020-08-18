UPDATE player
SET pin = crypt(${pin}, gen_salt('bf'))
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL