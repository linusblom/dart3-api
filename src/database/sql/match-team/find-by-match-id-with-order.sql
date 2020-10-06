SELECT id, "order"
FROM match_team
WHERE match_id = ${matchId}
ORDER BY "order"