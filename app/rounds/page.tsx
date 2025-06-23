"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { ArrowLeft, Play, Clock, Trophy } from "lucide-react"
import Link from "next/link"
import { generateSwissPairings, Player, Match } from "@/lib/pairings"

interface Tournament {
  id: string
  name: string
  rounds: number
  currentRound: number
  status: "setup" | "active" | "completed"
  players: Player[]
  matches: Match[]
  timePerRound: number
  roundStartTime?: number
}

function ScoreButton({
  value,
  onIncrement,
  onReset,
}: {
  value: number
  onIncrement: () => void
  onReset: () => void
}) {
  let timer: NodeJS.Timeout | null = null

  const start = () => {
    timer = setTimeout(() => {
      onReset()
      timer = null
    }, 500)
  }

  const end = () => {
    if (timer) {
      clearTimeout(timer)
      onIncrement()
    }
  }

  return (
    <button
      onMouseDown={start}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={(e) => {
        e.preventDefault()
        start()
      }}
      onTouchEnd={(e) => {
        e.preventDefault()
        end()
      }}
      onContextMenu={(e) => e.preventDefault()}
      className="px-2 py-1 border rounded w-8 text-center select-none"
    >
      {value}
    </button>
  )
}

export default function RoundsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    fetch("/api/tournament")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTournament(data)
        }
      })
  }, [])

  const saveTournament = (updatedTournament: Tournament) => {
    setTournament(updatedTournament)
    fetch("/api/tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTournament),
    })
  }


  const startRound = () => {
    if (!tournament) return

    const newPairings = generateSwissPairings(tournament.players, tournament.currentRound, tournament.matches)

    const updatedTournament = {
      ...tournament,
      matches: [...tournament.matches, ...newPairings],
      roundStartTime: Date.now(),
    }

    saveTournament(updatedTournament)
  }

  const updateMatchPoints = (
    matchId: string,
    player1Points: number,
    player2Points: number,
  ) => {
    if (!tournament) return

    const updatedMatches = tournament.matches.map((match) => {
      if (match.id === matchId) {
        let result: "player1" | "player2" | "draw" | undefined
        if (player1Points > player2Points) result = "player1"
        else if (player2Points > player1Points) result = "player2"
        else if (player1Points === player2Points && player1Points > 0)
          result = "draw"
        return { ...match, player1Points, player2Points, result }
      }
      return match
    })

    // Update player stats
    const updatedPlayers = tournament.players.map((player) => {
      const playerMatches = updatedMatches.filter(
        (m) => (m.player1Id === player.id || m.player2Id === player.id) && m.result,
      )

      let points = 0
      let matchWins = 0
      let matchLosses = 0
      let matchDraws = 0
      let gameWins = 0
      let gameLosses = 0
      const opponentIds: string[] = []

      playerMatches.forEach((match) => {
        const isPlayer1 = match.player1Id === player.id
        const opponentId = isPlayer1 ? match.player2Id : match.player1Id

        if (opponentId) {
          opponentIds.push(opponentId)
        }

        if (match.isBye) {
          points += 3
          matchWins += 1
          gameWins += 2
        } else {
          const p1 = match.player1Points || 0
          const p2 = match.player2Points || 0
          const playerPoints = isPlayer1 ? p1 : p2
          const oppPoints = isPlayer1 ? p2 : p1
          points += playerPoints
          if (playerPoints > oppPoints) matchWins += 1
          else if (playerPoints < oppPoints) matchLosses += 1
          else matchDraws += 1
        }

        if (!match.isBye && match.gameResults) {
          match.gameResults.forEach((gr) => {
            if (gr === (isPlayer1 ? "player1" : "player2")) {
              gameWins += 1
            } else {
              gameLosses += 1
            }
          })
        }
      })

      return {
        ...player,
        points,
        matchWins,
        matchLosses,
        matchDraws,
        gameWins,
        gameLosses,
        opponentIds: [...new Set(opponentIds)],
      }
    })

    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      players: updatedPlayers,
    }

    saveTournament(updatedTournament)
  }

  const canAdvanceRound = () => {
    if (!tournament) return false

    const currentRoundMatches = tournament.matches.filter((m) => m.round === tournament.currentRound)
    return currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.result)
  }

  const advanceRound = () => {
    if (!tournament || !canAdvanceRound()) return

    const nextRound = tournament.currentRound + 1
    const isCompleted = nextRound > tournament.rounds
    const updatedTournament = {
      ...tournament,
      currentRound: isCompleted ? tournament.rounds : nextRound,
      status: isCompleted ? ("completed" as const) : tournament.status,
      roundStartTime: undefined,
    }

    saveTournament(updatedTournament)
  }

  const getPlayerName = (playerId: string) => {
    return tournament?.players.find((p) => p.id === playerId)?.nickname || "Unknown"
  }

  if (!tournament) {
    return <div>Loading...</div>
  }

  const currentRoundMatches = tournament.matches.filter((m) => m.round === tournament.currentRound)
  const hasCurrentRoundMatches = currentRoundMatches.length > 0

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Round Management</h1>
              <p className="text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Round {tournament.currentRound}</Badge>
            <Badge variant={tournament.status === "completed" ? "default" : "secondary"}>
              {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
            </Badge>
          </div>
        </div>

        {tournament.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Tournament Completed!
              </CardTitle>
              <CardDescription className="text-green-700">
                All rounds have been completed. Check the leaderboard for final standings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leaderboard">
                <Button className="bg-green-600 hover:bg-green-700">View Final Results</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Round {tournament.currentRound} Pairings</span>
                  {!hasCurrentRoundMatches && tournament.status !== "completed" && (
                    <Button onClick={startRound}>
                      <Play className="mr-2 h-4 w-4" />
                      Generate Pairings
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {hasCurrentRoundMatches
                    ? "Enter match results as they complete"
                    : "Generate pairings to start the round"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasCurrentRoundMatches ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {tournament.status === "completed"
                      ? "Tournament completed. No more rounds to play."
                      : "Click 'Generate Pairings' to start this round."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentRoundMatches.map((match, index) => (
                      <div key={match.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              {match.isBye ? (
                                <div className="font-medium">
                                  {getPlayerName(match.player1Id)} <Badge variant="secondary">BYE</Badge>
                                </div>
                              ) : (
                                <div className="font-medium">
                                  {getPlayerName(match.player1Id)} vs {getPlayerName(match.player2Id)}
                                </div>
                              )}
                            </div>
                          </div>
                                <div className="flex items-center space-x-2">
                                <span>{getPlayerName(match.player1Id)}</span>
                                <ScoreButton
                                  value={match.player1Points || 0}
                                  onIncrement={() =>
                                    updateMatchPoints(
                                      match.id,
                                      (match.player1Points || 0) + 1,
                                      match.player2Points || 0,
                                    )
                                  }
                                  onReset={() =>
                                    updateMatchPoints(
                                      match.id,
                                      0,
                                      match.player2Points || 0,
                                    )
                                  }
                                />
                                <span className="mx-1">vs.</span>
                                <ScoreButton
                                  value={match.player2Points || 0}
                                  onIncrement={() =>
                                    updateMatchPoints(
                                      match.id,
                                      match.player1Points || 0,
                                      (match.player2Points || 0) + 1,
                                    )
                                  }
                                  onReset={() =>
                                    updateMatchPoints(
                                      match.id,
                                      match.player1Points || 0,
                                      0,
                                    )
                                  }
                                />
                                <span>{getPlayerName(match.player2Id)}</span>
                              </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Round Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Round:</span>
                    <span className="font-medium">
                      {tournament.currentRound} / {tournament.rounds}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matches:</span>
                    <span className="font-medium">
                      {currentRoundMatches.filter((m) => m.result).length} / {currentRoundMatches.length}
                    </span>
                  </div>
                </div>

                {canAdvanceRound() && tournament.currentRound < tournament.rounds && (
                  <Button onClick={advanceRound} className="w-full">
                    Advance to Round {tournament.currentRound + 1}
                  </Button>
                )}

                {canAdvanceRound() && tournament.currentRound >= tournament.rounds && (
                  <Button onClick={advanceRound} className="w-full">
                    Complete Tournament
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/timer">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="mr-2 h-4 w-4" />
                    Round Timer
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="mr-2 h-4 w-4" />
                    Current Standings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
