"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function RoundsPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    const savedTournament = localStorage.getItem("tournament")
    if (savedTournament) {
      setTournament(JSON.parse(savedTournament))
    }
  }, [])

  const saveTournament = (updatedTournament: Tournament) => {
    setTournament(updatedTournament)
    localStorage.setItem("tournament", JSON.stringify(updatedTournament))
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

  const updateMatchResult = (matchId: string, result: "player1" | "player2" | "draw") => {
    if (!tournament) return

    const updatedMatches = tournament.matches.map((match) => {
      if (match.id === matchId) {
        return { ...match, result }
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
        } else if (match.result === "draw") {
          points += 1
          matchDraws += 1
        } else if ((isPlayer1 && match.result === "player1") || (!isPlayer1 && match.result === "player2")) {
          points += 3
          matchWins += 1
        } else {
          matchLosses += 1
        }
      })

      return {
        ...player,
        points,
        matchWins,
        matchLosses,
        matchDraws,
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

                          {!match.isBye && (
                            <div className="flex items-center space-x-2">
                              {match.result ? (
                                <Badge variant="default">
                                  {match.result === "draw"
                                    ? "Draw"
                                    : `${getPlayerName(match.result === "player1" ? match.player1Id : match.player2Id)} Wins`}
                                </Badge>
                              ) : (
                                <Select onValueChange={(value) => updateMatchResult(match.id, value as any)}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select result" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="player1">{getPlayerName(match.player1Id)} Wins</SelectItem>
                                    <SelectItem value="player2">{getPlayerName(match.player2Id)} Wins</SelectItem>
                                    <SelectItem value="draw">Draw</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
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
