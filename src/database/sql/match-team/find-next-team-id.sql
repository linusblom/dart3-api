SELECT id FROM match_team WHERE id > ${matchTeamId} AND position = 0 AND match_id = ${matchId} ORDER BY id LIMIT 1;