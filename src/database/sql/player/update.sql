UPDATE player
SET name = ${name}, pro = ${pro}, double = ${double}, avatar = ${avatar}
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL