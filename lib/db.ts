import Database from 'better-sqlite3'

const db = new Database('tournament.db')

// Use Write-Ahead Logging to avoid database locking issues
db.prepare('PRAGMA journal_mode = WAL').run()

db.prepare(
  `CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )`
).run()

export default db
