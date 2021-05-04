ALTER TABLE player
  ADD COLUMN roles  TEXT[] DEFAULT '{"pin", "email-consent"}'::TEXT[],
  ADD COLUMN single SMALLINT DEFAULT 20,
  ADD COLUMN triple SMALLINT DEFAULT 20;

UPDATE player SET roles =
  CASE
    WHEN pin_disabled = false   AND admin = true  AND pro = true  THEN '{"pin", "admin", "pro"}'::TEXT[]
    WHEN pin_disabled = true    AND admin = true  AND pro = true  THEN '{"admin", "pro"}'::TEXT[]
    WHEN pin_disabled = false   AND admin = true  AND pro = false THEN '{"pin", "admin"}'::TEXT[]
    WHEN pin_disabled = false   AND admin = false AND pro = true  THEN '{"pin", "pro"}'::TEXT[]
    WHEN pin_disabled = true    AND admin = true  AND pro = false THEN '{"admin"}'::TEXT[]
    WHEN pin_disabled = true    AND admin = false AND pro = true  THEN '{"pro"}'::TEXT[]
    WHEN pin_disabled = false   AND admin = false AND pro = false THEN '{"pin"}'::TEXT[]
    ELSE '{}'::TEXT[]
  END;

ALTER TABLE player
  DROP COLUMN admin,
  DROP COLUMN pro,
  DROP COLUMN pin_disabled;

CREATE TABLE IF NOT EXISTS player_email_verification (
  uid         CHAR(20)      NOT NULL,
  token       CHAR(64)      NOT NULL,
  expires_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP + INTERVAL '1' DAY,
  PRIMARY KEY (uid)
);
