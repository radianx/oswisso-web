import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || 'current'

  let tournamentId = id

  if (id === 'current') {
    // Find the most recent active tournament
    const { data: activeTournament, error } = await supabase
      .from('tournaments')
      .select('id')
      .in('status', ['setup', 'active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !activeTournament) {
      return NextResponse.json({ message: 'No active tournament found' }, { status: 404 })
    }
    tournamentId = activeTournament.id
  }

  // Fetch tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single()

  if (tournamentError || !tournament) {
    return NextResponse.json({ message: 'Tournament not found' }, { status: 404 })
  }

  // Fetch players
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('tournament_id', tournamentId)

  if (playersError) {
    return NextResponse.json({ message: 'Error fetching players' }, { status: 500 })
  }

  // Fetch matches
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)

  if (matchesError) {
    return NextResponse.json({ message: 'Error fetching matches' }, { status: 500 })
  }

  // Map back to frontend structure
  const mappedTournament = {
    ...tournament,
    currentRound: tournament.current_round,
    timePerRound: tournament.time_per_round,
    roundStartTime: tournament.round_start_time,
    players: players.map((p: any) => ({
      ...p,
      matchWins: p.match_wins,
      matchLosses: p.match_losses,
      matchDraws: p.match_draws,
      gameWins: p.game_wins,
      gameLosses: p.game_losses,
      opponentIds: p.opponent_ids,
    })),
    matches: matches.map((m: any) => ({
      ...m,
      player1Id: m.player1_id,
      player2Id: m.player2_id,
      player1Points: m.player1_points,
      player2Points: m.player2_points,
      isBye: m.is_bye,
    })),
  }

  return NextResponse.json(mappedTournament)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Map frontend camelCase to backend snake_case
  const tournamentData = {
    id: body.id,
    name: body.name,
    rounds: body.rounds,
    current_round: body.currentRound,
    status: body.status,
    time_per_round: body.timePerRound,
    round_start_time: body.roundStartTime,
  }

  // Upsert tournament
  const { error: tournamentError } = await supabase
    .from('tournaments')
    .upsert(tournamentData)

  if (tournamentError) {
    console.error('Error saving tournament:', tournamentError)
    return NextResponse.json({ message: 'Error saving tournament' }, { status: 500 })
  }

  // Upsert players
  if (body.players && body.players.length > 0) {
    const playersData = body.players.map((p: any) => ({
      id: p.id,
      tournament_id: body.id,
      nickname: p.nickname,
      points: p.points,
      match_wins: p.matchWins,
      match_losses: p.matchLosses,
      match_draws: p.matchDraws,
      game_wins: p.gameWins,
      game_losses: p.gameLosses,
      opponent_ids: p.opponentIds,
    }))

    const { error: playersError } = await supabase
      .from('players')
      .upsert(playersData)

    if (playersError) {
      console.error('Error saving players:', playersError)
      return NextResponse.json({ message: 'Error saving players' }, { status: 500 })
    }

    // Also sync player nicknames to global_players for persistence
    const globalPlayersData = body.players.map((p: any) => ({
      nickname: p.nickname,
      updated_at: new Date().toISOString(),
    }))

    const { error: globalPlayersError } = await supabase
      .from('global_players')
      .upsert(globalPlayersData, { onConflict: 'nickname' })

    if (globalPlayersError) {
      console.error('Error syncing global players:', globalPlayersError)
      // Don't fail the request if global sync fails, just log it
    }
  }

  // Upsert matches
  if (body.matches && body.matches.length > 0) {
    const matchesData = body.matches.map((m: any) => ({
      id: m.id,
      tournament_id: body.id,
      round: m.round,
      player1_id: m.player1Id,
      player2_id: m.player2Id || null,
      player1_points: m.player1Points,
      player2_points: m.player2Points,
      result: m.result,
      is_bye: m.isBye,
    }))

    const { error: matchesError } = await supabase
      .from('matches')
      .upsert(matchesData)

    if (matchesError) {
      console.error('Error saving matches:', matchesError)
      return NextResponse.json({ message: 'Error saving matches' }, { status: 500 })
    }
  }

  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ message: 'Id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ message: 'Error deleting tournament' }, { status: 500 })
  }

  return NextResponse.json({ status: 'ok' })
}
