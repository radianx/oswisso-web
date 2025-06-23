import { NextResponse } from 'next/server'
import db from '@/lib/db'

// Ensure this handler runs in the Node.js runtime
export const runtime = 'nodejs'

export async function GET() {
  const rows = db.prepare('SELECT id, data FROM tournaments ORDER BY id DESC').all()
  const tournaments: any[] = []
  rows.forEach((row: any) => {
    try {
      const t = JSON.parse(row.data)
      tournaments.push({
        id: row.id,
        name: t.name,
        status: t.status,
        rounds: t.rounds,
        currentRound: t.currentRound,
        players: t.players.length,
        matches: t.matches.length,
      })
    } catch (err) {
      // Ignore malformed rows
    }
  })
  return NextResponse.json(tournaments)
}
