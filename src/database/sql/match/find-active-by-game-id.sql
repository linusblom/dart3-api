SELECT m.id as id, m.active_round as round, m.active_set as set, m.active_leg as leg, m.active_match_team_id as match_team_id, m.active_player_id as player_id, mt.team_id as team_id, mt.score as current_score
FROM match_active_player_id m
LEFT JOIN match_team mt ON mt.id = m.active_match_team_id
WHERE game_id = ${gameId} AND status = 'playing';
