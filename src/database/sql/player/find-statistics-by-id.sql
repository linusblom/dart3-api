WITH
  h AS (SELECT match_team_id, player_id, round, leg, set, value, multiplier FROM hit WHERE player_id = ${playerId}),
  r AS (SELECT sum(value * multiplier) as score FROM h GROUP BY match_team_id, player_id, round, leg, set)
SELECT
  (SELECT count(value) AS hits FROM h WHERE value > 0),
  (SELECT count(value) AS misses FROM h WHERE value = 0),
  (SELECT max(score) AS highest FROM r),
  (SELECT round(avg(score), 2) AS average FROM r),
  (SELECT count(score) AS one_hundred_eighty FROM r WHERE score = 180)