import Database from 'better-sqlite3'

// Increase the busy timeout to reduce "database is locked" errors during builds
const db = new Database('tournament.db', { timeout: 5000 })

// Use Write-Ahead Logging for better concurrency
db.pragma('journal_mode = WAL')

db.prepare(
  `CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )`
).run()

export default db
