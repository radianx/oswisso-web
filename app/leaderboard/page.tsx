"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Trophy, Medal, Award } from "lucide-react"
import Link from "next/link"

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

interface Player {
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

interface Match {
  id: string
  round: number
  player1Id: string
  player2Id: string
  result?: "player1" | "player2" | "draw"
  gameResults?: ("player1" | "player2")[]
  isBye?: boolean
}

interface PlayerWithTiebreakers extends Player {
  omwPercentage: number
  gwpPercentage: number
  rank: number
}

export default function LeaderboardPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    fetch("/api/tournament")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTournament(data)
      })
  }, [])

  const calculateTiebreakers = (players: Player[], matches: Match[]): PlayerWithTiebreakers[] => {
    const playersWithTiebreakers = players.map((player) => {
      // Calculate Opponent Match Win Percentage (OMW%)
      let totalOpponentWins = 0
      let totalOpponentMatches = 0

      player.opponentIds.forEach((opponentId) => {
        const opponent = players.find((p) => p.id === opponentId)
        if (opponent) {
          totalOpponentWins += opponent.matchWins
          totalOpponentMatches += opponent.matchWins + opponent.matchLosses + opponent.matchDraws
        }
      })

      const omwPercentage = totalOpponentMatches > 0 ? (totalOpponentWins / totalOpponentMatches) * 100 : 0

      // Calculate Game Win Percentage (GWP%)
      const totalGames = player.gameWins + player.gameLosses
      const gwpPercentage = totalGames > 0 ? (player.gameWins / totalGames) * 100 : 0

      return {
        ...player,
        omwPercentage,
        gwpPercentage,
        rank: 0,
      }
    })

    // Sort by points, then tiebreakers
    playersWithTiebreakers.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (Math.abs(a.omwPercentage - b.omwPercentage) > 0.01) return b.omwPercentage - a.omwPercentage
      if (Math.abs(a.gwpPercentage - b.gwpPercentage) > 0.01) return b.gwpPercentage - a.gwpPercentage
      return b.matchWins - a.matchWins
    })

    // Assign ranks
    playersWithTiebreakers.forEach((player, index) => {
      player.rank = index + 1
    })

    return playersWithTiebreakers
  }

  const exportToCSV = () => {
    if (!tournament) return

    const sortedPlayers = calculateTiebreakers(tournament.players, tournament.matches)

    const headers = ["Rank", "Player", "Points", "Match Record", "OMW%", "GWP%"]
    const rows = sortedPlayers.map((player) => [
      player.rank.toString(),
      player.nickname,
      player.points.toString(),
      `${player.matchWins}-${player.matchLosses}-${player.matchDraws}`,
      player.omwPercentage.toFixed(1) + "%",
      player.gwpPercentage.toFixed(1) + "%",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tournament.name}_leaderboard.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>
      case 2:
        return <Badge className="bg-gray-400 hover:bg-gray-500">2nd</Badge>
      case 3:
        return <Badge className="bg-amber-600 hover:bg-amber-700">3rd</Badge>
      default:
        return <Badge variant="outline">{rank}th</Badge>
    }
  }

  if (!tournament) {
    return <div>Loading...</div>
  }

  const sortedPlayers = calculateTiebreakers(tournament.players, tournament.matches)

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
              <p className="text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Round {tournament.currentRound} / {tournament.rounds}
            </Badge>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {tournament.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Tournament Champion: {sortedPlayers[0]?.nickname}
              </CardTitle>
              <CardDescription className="text-green-700">
                Final standings after {tournament.rounds} rounds
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Current Standings</CardTitle>
                <CardDescription>Players ranked by points and tiebreakers</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                      <TableHead className="text-center">Record</TableHead>
                      <TableHead className="text-center">OMW%</TableHead>
                      <TableHead className="text-center">GWP%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRankIcon(player.rank)}
                            {getRankBadge(player.rank)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{player.nickname}</TableCell>
                        <TableCell className="text-center font-bold">{player.points}</TableCell>
                        <TableCell className="text-center">
                          {player.matchWins}-{player.matchLosses}-{player.matchDraws}
                        </TableCell>
                        <TableCell className="text-center">{player.omwPercentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-center">{player.gwpPercentage.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Players</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedPlayers.slice(0, 3).map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(player.rank)}
                      <div>
                        <div className="font-medium">{player.nickname}</div>
                        <div className="text-sm text-muted-foreground">{player.points} points</div>
                      </div>
                    </div>
                    {getRankBadge(player.rank)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Players:</span>
                  <span className="font-medium">{tournament.players.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rounds Played:</span>
                  <span className="font-medium">
                    {tournament.currentRound - (tournament.status === "completed" ? 0 : 1)} / {tournament.rounds}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Matches:</span>
                  <span className="font-medium">{tournament.matches.filter((m) => m.result).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={tournament.status === "completed" ? "default" : "secondary"}>
                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tiebreaker Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>OMW%:</strong> Opponent Match Win Percentage - strength of opponents faced
                </p>
                <p>
                  <strong>GWP%:</strong> Game Win Percentage - individual game win rate
                </p>
                <p>Players are ranked by: Points → OMW% → GWP% → Match Wins</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
