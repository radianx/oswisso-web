import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// Use the Node.js runtime since we rely on the `better-sqlite3` package
export const runtime = 'nodejs'

interface Tournament {
  data: string; // Assuming `data` is a JSON string
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || 'current'
  let row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(id) as Tournament | undefined;

  if (!row) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  let data = JSON.parse(row.data)

  // If the "current" row stores only the active id, resolve it
  if (
    id === 'current' &&
    data &&
    typeof data === 'object' &&
    data.id &&
    !data.status
  ) {
    row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(data.id) as Tournament | undefined;
    if (!row) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    data = JSON.parse(row.data)
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = body.id || 'current'
  const data = JSON.stringify(body)

  const insertTournament = db.prepare(
    'INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)',
  )
  const insertCurrent = db.prepare(
    'INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)',
  )

  const save = db.transaction((tournamentId: string, payload: string) => {
    insertTournament.run(tournamentId, payload)
    if (tournamentId !== 'current') {
      insertCurrent.run('current', JSON.stringify({ id: tournamentId }))
    }
  })

  save(id, data)

  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ message: 'Id required' }, { status: 400 })
  }
  const del = db.prepare('DELETE FROM tournaments WHERE id = ?')
  db.transaction((tournamentId: string) => {
    del.run(tournamentId)
  })(id)
  return NextResponse.json({ status: 'ok' })
}
