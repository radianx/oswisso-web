import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || 'current'
  let row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(id)

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
    row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(data.id)
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
  db.prepare('INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)').run(
    id,
    data,
  )
  // Track the active tournament
  if (id !== 'current') {
    db.prepare('INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)').run(
      'current',
      JSON.stringify({ id }),
    )
  }
  return NextResponse.json({ status: 'ok' })
}
