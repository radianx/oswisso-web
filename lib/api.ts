export async function fetchTournament() {
  const res = await fetch('/api/tournament')
  if (!res.ok) return null
  return res.json()
}

export async function saveTournament(tournament: any) {
  await fetch('/api/tournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournament),
  })
}
