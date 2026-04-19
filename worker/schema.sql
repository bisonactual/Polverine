CREATE TABLE IF NOT EXISTS readings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT    NOT NULL,
  ts           INTEGER NOT NULL,
  iaq          REAL,
  iaq_accuracy INTEGER,
  temperature  REAL,
  humidity     REAL,
  pressure     REAL,
  co2_eq       REAL,
  voc_eq       REAL,
  pm1          REAL,
  pm2_5        REAL,
  pm10         REAL,
  obstructed   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_device_ts ON readings (device_id, ts DESC);
