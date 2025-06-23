import Database from 'better-sqlite3'

const db = new Database('tournament.db')

db.pragma('journal_mode = WAL')

db.prepare(
  `CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )`
).run()

export default db
