UPDATE player
SET name = ${name}, pro = ${pro}
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL