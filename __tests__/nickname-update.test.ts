import { NextRequest } from 'next/server'
import { POST } from '../app/api/tournament/route'
import { supabase } from '../lib/supabase'

jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}))

const from = jest.mocked(supabase.from)

const tournament = {
  id: 't1',
  name: 'Test',
  rounds: 1,
  currentRound: 1,
  status: 'setup',
  timePerRound: 30,
  players: [{
    id: 'p1',
    nickname: 'Updated nickname',
    points: 0,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    gameWins: 0,
    gameLosses: 0,
    opponentIds: [],
  }],
  matches: [],
}

function request() {
  return new NextRequest('http://localhost/api/tournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tournament),
  })
}

describe('nickname updates through the tournament API', () => {
  beforeEach(() => jest.clearAllMocks())
  afterEach(() => jest.restoreAllMocks())

  test('sends the updated nickname to tournament players and the global directory', async () => {
    const saveTournament = jest.fn().mockResolvedValue({ error: null })
    const savePlayers = jest.fn().mockResolvedValue({ error: null })
    const saveGlobalPlayers = jest.fn().mockResolvedValue({ error: null })
    from
      .mockReturnValueOnce({ upsert: saveTournament } as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce({ upsert: savePlayers } as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce({ upsert: saveGlobalPlayers } as unknown as ReturnType<typeof supabase.from>)

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
    expect(from.mock.calls).toEqual([['tournaments'], ['players'], ['global_players']])
    expect(savePlayers).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'p1', tournament_id: 't1', nickname: 'Updated nickname' }),
    ])
    expect(saveGlobalPlayers).toHaveBeenCalledWith([
      expect.objectContaining({ nickname: 'Updated nickname', updated_at: expect.any(String) }),
    ], { onConflict: 'nickname' })
  })

  test('reports a failed player save instead of returning success', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const saveTournament = jest.fn().mockResolvedValue({ error: null })
    const savePlayers = jest.fn().mockResolvedValue({ error: { message: 'Database unavailable' } })
    from
      .mockReturnValueOnce({ upsert: saveTournament } as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce({ upsert: savePlayers } as unknown as ReturnType<typeof supabase.from>)

    const response = await POST(request())

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Error saving players' })
    expect(from).not.toHaveBeenCalledWith('global_players')
  })
})
