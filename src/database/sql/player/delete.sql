UPDATE player
SET deleted_at = CURRENT_TIMESTAMP
WHERE user_id = ${userId} AND id = ${id} AND deleted_at IS NULL;