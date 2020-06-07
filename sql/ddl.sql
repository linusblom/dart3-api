CREATE EXTENSION pgcrypto;

CREATE TABLE IF NOT EXISTS player (
  id                    SERIAL,
  user_id               CHAR(30)      NOT NULL,
  uid                   CHAR(20)      NOT NULL,
  name                  VARCHAR(64)   NOT NULL,
  email                 VARCHAR       NOT NULL,
  balance               NUMERIC(10,2) DEFAULT 0,
  pin                   VARCHAR(60)   NOT NULL,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  deleted_at            TIMESTAMP,
  color                 CHAR(7)       DEFAULT '#FFFFFF',
  avatar                VARCHAR,
  xp                    INTEGER       DEFAULT 0,
  pro                   BOOLEAN       DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TYPE transaction_type AS ENUM (
  'system',
  'bet',
  'win',
  'jackpot',
  'deposit',
  'withdrawal',
  'transfer',
  'refund'
);

CREATE TABLE IF NOT EXISTS transaction (
  id            SERIAL,
  player_id     INTEGER,
  type          transaction_type  NOT NULL,
  debit         NUMERIC(10,2)     DEFAULT 0,
  credit        NUMERIC(10,2)     DEFAULT 0,
  balance       NUMERIC(10,2)     NOT NULL CHECK (balance >= 0),
  created_at    TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  description   VARCHAR(100),
  PRIMARY KEY (id),
  FOREIGN KEY (player_id) REFERENCES player (id)
);

CREATE TYPE game_type AS ENUM (
  'halve_it',
  'legs',
  '301_si_do',
  '501_si_do',
  '301_di_do',
  '501_di_do'
);

CREATE TABLE IF NOT EXISTS game (
  id                SERIAL,
  user_id           CHAR(30)      NOT NULL,
  uid               CHAR(20)      NOT NULL,
  type              game_type     NOT NULL,
  tournament        BOOLEAN       NOT NULL,
  team              BOOLEAN       NOT NULL,
  legs              SMALLINT      NOT NULL,
  sets              SMALLINT      NOT NULL,
  bet               SMALLINT      NOT NULL,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  started_at        TIMESTAMP,
  ended_at          TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS team (
  id            SERIAL,
  game_id       INTEGER   NOT NULL,
  win           SMALLINT  DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id)
);

CREATE TABLE IF NOT EXISTS team_player (
  id            SERIAL,
  team_id       INTEGER,
  player_id     INTEGER   NOT NULL,
  game_id       INTEGER   NOT NULL,
  xp            SMALLINT  DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (team_id) REFERENCES team (id),
  FOREIGN KEY (player_id) REFERENCES player (id),
  FOREIGN KEY (game_id) REFERENCES game (id)
);

CREATE TYPE match_status AS ENUM (
  'waiting',
  'ready',
  'playing',
  'completed'
);

CREATE TABLE IF NOT EXISTS match (
  id                    SERIAL,
  game_id               INTEGER       NOT NULL,
  status                match_status  NOT NULL,
  active_set            SMALLINT      DEFAULT 1,
  active_leg            SMALLINT      DEFAULT 1,
  active_round          SMALLINT      DEFAULT 1,
  active_match_team_id  INTEGER,
  stage                 SMALLINT      NOT NULL,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  started_at            TIMESTAMP,
  ended_at              TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id)
);

CREATE TABLE IF NOT EXISTS match_team (
  id        SERIAL,
  match_id  INTEGER   NOT NULL,
  team_id   INTEGER   NOT NULL,
  sets      SMALLINT  DEFAULT 0,
  legs      SMALLINT  DEFAULT 0,
  score     SMALLINT  DEFAULT 0,
  position  SMALLINT  DEFAULT 0,
  gems      SMALLINT  DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (match_id) REFERENCES match (id),
  FOREIGN KEY (team_id) REFERENCES team (id)
);

ALTER TABLE match ADD FOREIGN KEY (active_match_team_id) REFERENCES match_team (id);

CREATE TABLE IF NOT EXISTS hit (
  id              SERIAL,
  match_team_id   INTEGER,
  player_id       INTEGER,
  dart            SMALLINT  NOT NULL,
  round           SMALLINT  NOT NULL,
  leg             SMALLINT  NOT NULL,
  set             SMALLINT  NOT NULL,
  value           SMALLINT  NOT NULL,
  multiplier      SMALLINT  NOT NULL,
  approved_score  SMALLINT  NOT NULL,
  gem             BOOLEAN   NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (match_team_id) REFERENCES match_team (id),
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE(match_team_id, dart, round, leg, set)
);

CREATE TABLE IF NOT EXISTS jackpot (
  id              SERIAL,
  user_id         CHAR(30)      NOT NULL,
  match_team_id   INTEGER,
  value           NUMERIC(10,2) DEFAULT 0,
  next_value      NUMERIC(10,2) DEFAULT 0,
  started_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  won_at          TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (match_team_id) REFERENCES match_team (id)
);

CREATE OR REPLACE VIEW match_active_player_id AS
SELECT m.id, m.game_id, m.status, m.active_round, m.active_set, m.active_leg, m.active_match_team_id, m.stage, m.created_at, m.started_at, m.ended_at, tp.player_id as active_player_id
FROM match m
LEFT JOIN match_team mt ON m.active_match_team_id = mt.id
LEFT JOIN team_player tp ON tp.team_id = mt.team_id AND tp.player_id = (
  SELECT player_id
  FROM team_player
  WHERE team_id = mt.team_id
  ORDER BY (
    CASE WHEN MOD(m.active_round, 2) = 1 THEN id END
  ) ASC, id DESC
  LIMIT 1
);

CREATE OR REPLACE FUNCTION update_player_balance()
  RETURNS TRIGGER AS $$
BEGIN
  UPDATE player SET balance = NEW.balance WHERE id = NEW.player_id;
  RETURN NEW;
END; $$ language plpgsql;

CREATE TRIGGER new_transaction AFTER INSERT ON transaction FOR EACH ROW EXECUTE PROCEDURE update_player_balance();

CREATE OR REPLACE FUNCTION init_player_balace()
  RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO transaction (player_id, type, balance) VALUES (NEW.id, 'system', 0);
  RETURN NEW;
END; $$ language plpgsql;

CREATE TRIGGER new_player AFTER INSERT ON player FOR EACH ROW EXECUTE PROCEDURE init_player_balace();
