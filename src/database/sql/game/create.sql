INSERT INTO game (user_id, type, tournament, team, legs, sets, bet)
VALUES (${userId}, ${type}, ${tournament}, ${team}, ${legs}, ${sets}, ${bet})
RETURNING id, type, tournament, team, legs, sets, bet, created_at, started_at, ended_at;