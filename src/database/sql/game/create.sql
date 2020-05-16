INSERT INTO game (user_id, type, mode, team_size, legs, sets, bet)
VALUES (${userId}, ${type}, ${mode}, ${teamSize}, ${legs}, ${sets}, ${bet})
RETURNING id, type, mode, team_size, legs, sets, bet, current_team_id, current_leg, current_set, created_at, started_at, ended_at;