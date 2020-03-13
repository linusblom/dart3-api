CREATE TABLE IF NOT EXISTS player (
  id                    SERIAL,
  account_id            CHAR(30)      NOT NULL,
  name                  VARCHAR(64)   NOT NULL,
  balance               NUMERIC(10,2) DEFAULT 0,
  created_at            TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  color                 CHAR(7),
  avatar                VARCHAR,
  xp                    INTEGER       DEFAULT 0,
  high_score            SMALLINT      DEFAULT 0,
  one_hundred_eighties  SMALLINT      DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TYPE transaction_type AS ENUM (
  'bet',
  'win',
  'jackpot',
  'deposit',
  'withdrawal',
  'transfer'
);

CREATE TABLE IF NOT EXISTS "transaction" (
  id            SERIAL,
  player_id     INTEGER,
  type          transaction_type  NOT NULL,
  debit         NUMERIC(5,2)      DEFAULT 0,
  credit        NUMERIC(5,2)      DEFAULT 0,
  balance       NUMERIC(10,2)     NOT NULL,
  created_at    TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  description  VARCHAR(100),
  PRIMARY KEY (id),
  FOREIGN KEY (player_id) REFERENCES player (id)
);

CREATE TYPE game_type AS ENUM (
  'havleit',
  'legs',
  'legs_classic',
  '301_si_do',
  '501_si_do',
  '301_di_do',
  '501_di_do'
);

CREATE TABLE IF NOT EXISTS game (
  id              SERIAL,
  account_id      CHAR(30)  NOT NULL,
  type            game_type NOT NULL,
  legs            SMALLINT  DEFAULT 1,
  sets            SMALLINT  DEFAULT 1,
  game_player_id  INTEGER   NOT NULL,
  bet             SMALLINT  NOT NULL,
  started_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at        TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS game_player (
  id        SERIAL,
  game_id   INTEGER,
  player_id INTEGER,
  turn      SMALLINT  NOT NULL,
  leg       SMALLINT  DEFAULT 1,
  set       SMALLINT  DEFAULT 1,
  score     SMALLINT  DEFAULT 0,
  position  SMALLINT  DEFAULT 0,
  xp        SMALLINT  DEFAULT 0,
  win       SMALLINT  DEFAULT 0,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id),
  FOREIGN KEY (player_id) REFERENCES player (id)
);

CREATE TABLE IF NOT EXISTS game_score (
  id              SERIAL,
  game_player_id  INTEGER,
  leg             SMALLINT  NOT NULL,
  set             SMALLINT  NOT NULL,
  valid           BOOLEAN   NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (game_player_id) REFERENCES game_player (id)
);

CREATE TABLE IF NOT EXISTS game_dart (
  id            SERIAL,
  game_score_id INTEGER,
  dart          SMALLINT  NOT NULL,
  score         SMALLINT  NOT NULL,
  multiplier    SMALLINT  NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (game_score_id) REFERENCES game_score (id)
);

CREATE TABLE IF NOT EXISTS jackpot (
  id          SERIAL,
  game_id     INTEGER,
  player_id   INTEGER,
  account_id  CHAR(30)      NOT NULL,
  value       NUMERIC(5,2)  DEFAULT 0,
  next_value  NUMERIC(5,2)  DEFAULT 0,
  started_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  ended_at    TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (game_id) REFERENCES game (id),
  FOREIGN KEY (player_id) REFERENCES player (id)
);
