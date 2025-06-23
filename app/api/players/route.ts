import { NextResponse } from 'next/server'
import db from '@/lib/db'

// `better-sqlite3` only works in the Node.js runtime
export const runtime = 'nodejs'

export async function GET() {
  const rows = db
    .prepare('SELECT data FROM tournaments WHERE id != ?')
    .all('current')
  const names = new Set<string>()
  rows.forEach((row: any) => {
    try {
      const data = JSON.parse(row.data)
      if (Array.isArray(data.players)) {
        for (const p of data.players) {
          if (p && p.nickname) names.add(p.nickname)
        }
      }
    } catch (err) {
      // ignore malformed rows
    }
  })
  return NextResponse.json(Array.from(names))
}
