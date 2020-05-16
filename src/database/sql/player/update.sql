UPDATE player
SET name = ${name}, seed = ${seed}
WHERE user_id = ${userId} AND id = ${id} AND deleted_at IS NULL;