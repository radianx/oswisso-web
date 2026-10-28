// Run after building with the README's loopback Supabase values.
// This stub checks HTTP wiring and serialization, not Supabase policies or SQL.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'

// NEXT_PUBLIC values are embedded at build time. Refuse an unrelated build.
for (const route of ['tournament', 'tournaments', 'players']) {
  const code = await readFile(`.next/server/app/api/${route}/route.js`, 'utf8')
  assert(code.includes('http://127.0.0.1:54321'), 'Rebuild with the documented loopback test URL before running this smoke check')
  assert(code.includes('test-only-anon-key'), 'Rebuild with the documented test key')
}

const tables = { tournaments: [], players: [], matches: [], global_players: [] }
const calls = []
const stub = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const table = url.pathname.split('/').pop()
  calls.push(`${req.method} ${table}`)
  if (!(table in tables)) { res.writeHead(404).end(); return }
  let rows = tables[table]
  let data
  if (req.method === 'POST') {
    let raw = ''
    for await (const part of req) raw += part
    for (const row of [JSON.parse(raw)].flat()) {
      const key = table === 'global_players' ? 'nickname' : 'id'
      const index = rows.findIndex(item => item[key] === row[key])
      if (index < 0) rows.push(row)
      else rows[index] = { ...rows[index], ...row }
    }
    data = null
  } else {
    for (const [key, value] of url.searchParams) {
      if (value.startsWith('eq.')) rows = rows.filter(row => String(row[key]) === value.slice(3))
    }
    if (url.searchParams.get('select')?.includes('players(count)')) {
      rows = rows.map(row => ({ ...row,
        players: [{ count: tables.players.filter(p => p.tournament_id === row.id).length }],
        matches: [{ count: tables.matches.filter(m => m.tournament_id === row.id).length }],
      }))
    }
    data = req.headers.accept?.includes('application/vnd.pgrst.object+json') ? rows[0] : rows
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
})
let app
try {
  stub.listen(54321, '127.0.0.1')
  await once(stub, 'listening')
  // Override any inherited Supabase settings. No live database is used.
  app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3100'], {
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-only-anon-key' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  app.stdout.on('data', chunk => { logs += chunk })
  app.stderr.on('data', chunk => { logs += chunk })
  const base = 'http://127.0.0.1:3100'
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(base)).ok } catch {}
    if (ready) break
    if (app.exitCode !== null) throw new Error(logs)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert(ready, `Server did not start: ${logs}`)
  async function json(path, options) {
    const response = await fetch(base + path, options)
    assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`)
    return response.json()
  }
  const tournament = { id: 'test-t1', name: 'Smoke test', rounds: 3, currentRound: 0, status: 'setup', timePerRound: 45, players: [], matches: [] }
  const save = () => json('/api/tournament', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tournament) })
  await save()
  tournament.players = ['Alice', 'Bob'].map((nickname, i) => ({ id: `test-p${i}`, nickname, points: 0, matchWins: 0, matchLosses: 0, matchDraws: 0, gameWins: 0, gameLosses: 0, opponentIds: [] }))
  await save()
  tournament.players[0].nickname = 'Alice updated'
  tournament.status = 'active'
  tournament.currentRound = 1
  tournament.matches = [{ id: 'test-m1', round: 1, player1Id: 'test-p0', player2Id: 'test-p1', player1Points: 3, player2Points: 0, result: 'player1' }]
  await save()
  const restored = await json('/api/tournament?id=test-t1')
  assert.equal(restored.players[0].nickname, 'Alice updated')
  assert.equal(restored.matches[0].player1Points, 3)
  assert.equal(restored.currentRound, 1)
  assert.equal((await json('/api/tournament')).id, tournament.id)
  assert((await json('/api/players')).includes('Alice updated'))
  assert.equal((await json('/api/tournaments'))[0].players, 2)
  assert.equal((await fetch(base + '/api/tournament', { method: 'DELETE' })).status, 400)
  let assets = new Set()
  for (const path of ['/', '/setup', '/players', '/rounds', '/timer', '/leaderboard', '/history', '/history/test-t1']) {
    const response = await fetch(base + path)
    assert.equal(response.status, 200, path)
    const html = await response.text()
    for (const match of html.matchAll(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+)"/g)) assets.add(match[1].replaceAll('&amp;', '&'))
  }
  assert(assets.size > 0)
  for (const asset of assets) assert.equal((await fetch(base + asset)).status, 200, asset)
  const rsc = await fetch(base + '/players', { headers: { RSC: '1' } })
  assert.equal(rsc.status, 200)
  assert.match(rsc.headers.get('content-type'), /text\/x-component/)
  assert(calls.includes('POST matches'))
  console.log(`PASS: 8 pages, ${assets.size} assets, RSC, tournament create/read/update, nicknames, scores, directory/history/current APIs, missing-ID validation`)
} finally {
  if (app && app.exitCode === null) { app.kill('SIGTERM'); await once(app, 'exit') }
  await new Promise(resolve => stub.close(resolve))
}
