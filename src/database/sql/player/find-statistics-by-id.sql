WITH
  h AS (SELECT match_team_id, player_id, round, leg, set, value, multiplier FROM hit WHERE player_id = ${playerId}),
  r AS (SELECT SUM(value * multiplier) as score FROM h GROUP BY match_team_id, player_id, round, leg, set)
SELECT
  (SELECT COUNT(value) AS hits FROM h WHERE value > 0),
  (SELECT COUNT(value) AS misses FROM h WHERE value = 0),
  (SELECT COALESCE(MAX(score), 0) AS highest FROM r),
  (SELECT COALESCE(ROUND(AVG(score), 2), 0.00) AS average FROM r),
  (SELECT COUNT(score) AS one_hundred_eighty FROM r WHERE score = 180)