CREATE EXTENSION pgcrypto;

CREATE TABLE IF NOT EXISTS player (
  id                    SERIAL,
  user_id               CHAR(30)      NOT NULL,
  name                  VARCHAR(64)   NOT NULL,
  email                 VARCHAR       NOT NULL,
  balance               NUMERIC(10,2) DEFAULT 0,
  pin                   VARCHAR(60)   NOT NULL,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  deleted_at            TIMESTAMP,
  color                 CHAR(7)       DEFAULT '#FFFFFF',
  avatar                VARCHAR,
  xp                    INTEGER       DEFAULT 0,
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
  description  VARCHAR(100),
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
  id              SERIAL,
  user_id         CHAR(30)  NOT NULL,
  type            game_type NOT NULL,
  legs            SMALLINT  DEFAULT 1 CHECK (legs BETWEEN 1 AND 3),
  sets            SMALLINT  DEFAULT 1 CHECK (sets BETWEEN 1 AND 3),
  bet             SMALLINT  NOT NULL,
  game_player_id  INTEGER,
  current_leg     SMALLINT  DEFAULT 0 CHECK (current_leg <= 3),
  current_set     SMALLINT  DEFAULT 0 CHECK (current_set <= 3),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at      TIMESTAMP,
  ended_at        TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS game_player (
  id        SERIAL,
  game_id   INTEGER,
  player_id INTEGER,
  turn      SMALLINT,
  legs      SMALLINT  DEFAULT 0 CHECK (legs <= 3),
  sets      SMALLINT  DEFAULT 0 CHECK (sets <= 3),
  total     SMALLINT  DEFAULT 0,
  position  SMALLINT  DEFAULT 0,
  xp        SMALLINT  DEFAULT 0,
  win       SMALLINT  DEFAULT 0,
  gems      SMALLINT  DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id),
  FOREIGN KEY (player_id) REFERENCES player (id),
  UNIQUE(game_id, player_id)
);

ALTER TABLE game ADD FOREIGN KEY (game_player_id) REFERENCES game_player (id);

CREATE TABLE IF NOT EXISTS game_score (
  id              SERIAL,
  game_player_id  INTEGER,
  dart            SMALLINT  NOT NULL CHECK (dart BETWEEN 1 AND 3),
  round           SMALLINT  NOT NULL CHECK (round > 0),
  leg             SMALLINT  NOT NULL CHECK (leg BETWEEN 1 AND 3),
  set             SMALLINT  NOT NULL CHECK (set BETWEEN 1 AND 3),
  value           SMALLINT  NOT NULL CHECK (score BETWEEN 1 AND 25),
  multiplier      SMALLINT  NOT NULL CHECK (multiplier BETWEEN 1 AND 3),
  total           SMALLINT  NOT NULL CHECK (total <= 180),
  PRIMARY KEY (id),
  FOREIGN KEY (game_player_id) REFERENCES game_player (id),
  UNIQUE(game_player_id, dart, round, leg, set)
);

CREATE TABLE IF NOT EXISTS jackpot (
  id          SERIAL,
  game_id     INTEGER,
  player_id   INTEGER,
  user_id     CHAR(30)      NOT NULL,
  value       NUMERIC(10,2) DEFAULT 0,
  next_value  NUMERIC(10,2) DEFAULT 0,
  started_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  won_at      TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id),
  FOREIGN KEY (player_id) REFERENCES player (id)
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
