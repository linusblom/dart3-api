UPDATE player
SET name = ${name}, single = ${single}, double = ${double}, triple = ${triple}, avatar = ${avatar}
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL