DELETE FROM team_player
WHERE game_id = ${gameId} AND player_id = ${playerId}
RETURNING id;