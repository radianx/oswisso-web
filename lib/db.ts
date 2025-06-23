import Database from 'better-sqlite3'

const db = new Database('tournament.db')

// Use Write-Ahead Logging to avoid database locking issues
db.prepare('PRAGMA journal_mode = WAL').run()
// Wait for locks to clear instead of immediately failing
db.pragma('busy_timeout = 5000')

db.prepare(
  `CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )`
).run()

export default db
