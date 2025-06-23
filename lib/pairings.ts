export interface Player {
  id: string
  nickname: string
  points: number
  matchWins: number
  matchLosses: number
  matchDraws: number
  gameWins: number
  gameLosses: number
  opponentIds: string[]
}

export interface Match {
  id: string
  round: number
  player1Id: string
  player2Id: string
  player1Points?: number
  player2Points?: number
  result?: "player1" | "player2" | "draw"
  gameResults?: ("player1" | "player2")[]
  isBye?: boolean
}

export function generateSwissPairings(players: Player[], round: number, existingMatches: Match[]): Match[] {
  // Sort players by points (descending), then by tiebreakers
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    return b.matchWins - a.matchWins
  })

  const pairings: Match[] = []
  const paired = new Set<string>()

  // For first round, pair randomly
  if (round === 1) {
    const shuffled = [...sortedPlayers].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairings.push({
        id: `${round}-${i / 2 + 1}`,
        round,
        player1Id: shuffled[i].id,
        player2Id: shuffled[i + 1].id,
      })
    }

    // Handle bye if odd number of players
    if (shuffled.length % 2 === 1) {
      pairings.push({
        id: `${round}-bye`,
        round,
        player1Id: shuffled[shuffled.length - 1].id,
        player2Id: "",
        isBye: true,
        result: "player1",
        player1Points: 3,
        player2Points: 0,
      })
    }

    return pairings
  }

  // Swiss pairing for subsequent rounds
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player1 = sortedPlayers[i]
    if (paired.has(player1.id)) continue

    let paired_player: Player | null = null

    // Find best opponent (similar points, haven't played before)
    for (let j = i + 1; j < sortedPlayers.length; j++) {
      const player2 = sortedPlayers[j]
      if (paired.has(player2.id)) continue

      // Check if they've played before
      const hasPlayed = existingMatches.some(
        (match) =>
          (match.player1Id === player1.id && match.player2Id === player2.id) ||
          (match.player1Id === player2.id && match.player2Id === player1.id),
      )

      if (!hasPlayed) {
        paired_player = player2
        break
      }
    }

    // If no valid opponent found, pair with closest available
    if (!paired_player) {
      for (let j = i + 1; j < sortedPlayers.length; j++) {
        const player2 = sortedPlayers[j]
        if (!paired.has(player2.id)) {
          paired_player = player2
          break
        }
      }
    }

    if (paired_player) {
      pairings.push({
        id: `${round}-${pairings.length + 1}`,
        round,
        player1Id: player1.id,
        player2Id: paired_player.id,
      })
      paired.add(player1.id)
      paired.add(paired_player.id)
    }
  }

  // Handle bye if odd number of players
  const unpairedPlayer = sortedPlayers.find((p) => !paired.has(p.id))
  if (unpairedPlayer) {
    pairings.push({
      id: `${round}-bye`,
      round,
      player1Id: unpairedPlayer.id,
      player2Id: "",
      isBye: true,
      result: "player1",
      player1Points: 3,
      player2Points: 0,
    })
  }

  return pairings
}
