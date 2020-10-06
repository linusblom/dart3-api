UPDATE player
SET name = ${name}, pro = ${pro}, double = ${double}
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL