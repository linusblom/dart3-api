INSERT INTO game (user_id, uid, type, tournament, team, legs, sets, bet)
VALUES (${userId}, ${uid}, ${type}, ${tournament}, ${team}, ${legs}, ${sets}, ${bet})
RETURNING id, type, tournament, team, legs, sets, bet, prize_pool, created_at, started_at, ended_at