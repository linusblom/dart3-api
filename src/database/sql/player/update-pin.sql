UPDATE player
SET pin = crypt(${pin}, gen_salt('bf')), roles = CASE WHEN 'pin' = ANY(roles) THEN roles ELSE array_append(roles, 'pin') END
WHERE user_id = ${userId} AND uid = ${uid} AND deleted_at IS NULL