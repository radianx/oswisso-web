import { generateSwissPairings, Player, Match } from '../lib/pairings'

describe('generateSwissPairings', () => {
  const basePlayer = {
    points: 0,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    gameWins: 0,
    gameLosses: 0,
    opponentIds: [],
  }

  test('first round pairs players randomly', () => {
    const players: Player[] = [
      { id: '1', nickname: 'P1', ...basePlayer },
      { id: '2', nickname: 'P2', ...basePlayer },
      { id: '3', nickname: 'P3', ...basePlayer },
      { id: '4', nickname: 'P4', ...basePlayer },
    ]

    const pairings = generateSwissPairings(players, 1, [])
    expect(pairings.length).toBe(2)

    const ids = pairings.flatMap(p => p.isBye ? [p.player1Id] : [p.player1Id, p.player2Id])
    expect(new Set(ids).size).toBe(4)
  })

  test('later rounds avoid repeated opponents', () => {
    const players: Player[] = [
      { id: '1', nickname: 'P1', points: 3, matchWins: 1, matchLosses: 0, matchDraws: 0, gameWins: 0, gameLosses: 0, opponentIds: ['2'] },
      { id: '2', nickname: 'P2', points: 0, matchWins: 0, matchLosses: 1, matchDraws: 0, gameWins: 0, gameLosses: 0, opponentIds: ['1'] },
      { id: '3', nickname: 'P3', points: 3, matchWins: 1, matchLosses: 0, matchDraws: 0, gameWins: 0, gameLosses: 0, opponentIds: ['4'] },
      { id: '4', nickname: 'P4', points: 0, matchWins: 0, matchLosses: 1, matchDraws: 0, gameWins: 0, gameLosses: 0, opponentIds: ['3'] },
    ]

    const existingMatches: Match[] = [
      { id: '1-1', round: 1, player1Id: '1', player2Id: '2' },
      { id: '1-2', round: 1, player1Id: '3', player2Id: '4' },
    ]

    const pairings = generateSwissPairings(players, 2, existingMatches)
    expect(pairings.length).toBe(2)
    pairings.forEach(pair => {
      const repeated = existingMatches.some(
        m =>
          (m.player1Id === pair.player1Id && m.player2Id === pair.player2Id) ||
          (m.player1Id === pair.player2Id && m.player2Id === pair.player1Id)
      )
      expect(repeated).toBe(false)
    })
  })

  test('assigns bye when odd number of players', () => {
    const players: Player[] = [
      { id: '1', nickname: 'P1', ...basePlayer },
      { id: '2', nickname: 'P2', ...basePlayer },
      { id: '3', nickname: 'P3', ...basePlayer },
    ]

    const pairings = generateSwissPairings(players, 1, [])
    const byes = pairings.filter(p => p.isBye)
    expect(byes.length).toBe(1)
    expect(byes[0].player1Id).toBeDefined()
  })
})
