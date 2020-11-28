UPDATE player
SET deleted_at = CURRENT_TIMESTAMP
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL
RETURNING id