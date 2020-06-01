UPDATE player
SET name = ${name}, pro = ${pro}
WHERE user_id = ${userId} AND id = ${id} AND deleted_at IS NULL;