SELECT id, game_id, legs, sets, total, position
FROM team
WHERE game_id = ${gameId};