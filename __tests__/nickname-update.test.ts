import db from '../lib/db'

interface Tournament {
  id: string
  name: string
  rounds: number
  currentRound: number
  status: 'setup' | 'active' | 'completed'
  players: Player[]
  matches: any[]
  timePerRound: number
}

interface Player {
  id: string
  nickname: string
  points: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  gameWins: number
  gameLosses: number
  opponentIds: string[]
}

const basePlayer: Omit<Player, 'id' | 'nickname'> = {
  points: 0,
  matchWins: 0,
  matchLosses: 0,
  matchDraws: 0,
  gameWins: 0,
  gameLosses: 0,
  opponentIds: [],
}

describe('nickname updates', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM tournaments').run()
  })

  test('updates are persisted in the database', () => {
    const tournament: Tournament = {
      id: 't1',
      name: 'Test',
      rounds: 1,
      currentRound: 1,
      status: 'setup',
      players: [{ id: 'p1', nickname: 'Old', ...basePlayer }],
      matches: [],
      timePerRound: 0,
    }

    db.prepare('INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)').run(
      tournament.id,
      JSON.stringify(tournament),
    )

    tournament.players[0].nickname = 'New'
    db.prepare('INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)').run(
      tournament.id,
      JSON.stringify(tournament),
    )

    const row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(
      tournament.id,
    )
    const saved = JSON.parse(row.data)
    expect(saved.players[0].nickname).toBe('New')
  })
})
