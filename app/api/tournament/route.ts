import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || 'current'
  const row = db.prepare('SELECT data FROM tournaments WHERE id = ?').get(id)
  if (!row) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(JSON.parse(row.data))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = body.id || 'current'
  const data = JSON.stringify(body)
  db.prepare('INSERT OR REPLACE INTO tournaments (id, data) VALUES (?, ?)').run(
    id,
    data,
  )
  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ message: 'Id required' }, { status: 400 })
  }
  db.prepare('DELETE FROM tournaments WHERE id = ?').run(id)
  return NextResponse.json({ status: 'ok' })
}
