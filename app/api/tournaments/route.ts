import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*, players(count), matches(count)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ message: 'Error fetching tournaments' }, { status: 500 })
  }

  const tournaments = data.map((t: any) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    rounds: t.rounds,
    currentRound: t.current_round,
    players: t.players?.[0]?.count || 0,
    matches: t.matches?.[0]?.count || 0,
  }))

  return NextResponse.json(tournaments)
}
