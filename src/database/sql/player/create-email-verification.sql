INSERT INTO player_email_verification (uid, token) VALUES (${uid}, ${token})
ON CONFLICT (uid) DO UPDATE SET token = ${token}, expires_at = CURRENT_TIMESTAMP + INTERVAL '1' DAY