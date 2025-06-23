import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const rows = db.prepare('SELECT id, data FROM tournaments ORDER BY id DESC').all()
  const tournaments = rows.map((row: any) => {
    const t = JSON.parse(row.data)
    return {
      id: row.id,
      name: t.name,
      status: t.status,
      rounds: t.rounds,
      currentRound: t.currentRound,
      players: t.players.length,
      matches: t.matches.length,
    }
  })
  return NextResponse.json(tournaments)
}
