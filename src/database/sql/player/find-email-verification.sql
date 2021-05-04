SELECT p.id, p.user_id, p.email FROM player_email_verification pev
LEFT JOIN player p ON pev.uid = p.uid
WHERE pev.uid = ${uid} AND pev.token = ${token} AND expires_at >= CURRENT_TIMESTAMP