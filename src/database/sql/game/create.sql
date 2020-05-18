INSERT INTO game (user_id, type, tournament, team_size, legs, sets, bet)
VALUES (${userId}, ${type}, ${tournament}, ${teamSize}, ${legs}, ${sets}, ${bet})
RETURNING id, type, tournament, team_size, legs, sets, bet, created_at, started_at, ended_at;