"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trophy, Play, Settings } from "lucide-react"
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
  player1Points?: number
  player2Points?: number
  result?: "player1" | "player2" | "draw"
  gameResults?: ("player1" | "player2")[]
  isBye?: boolean
}

export default function HomePage() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    fetch("/api/tournament?id=current")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTournament(data)
          setShowPrompt(true)
        }
      })
  }, [])

  useEffect(() => {
    if (tournament?.status === "active" && tournament.roundStartTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - tournament.roundStartTime!
        const remaining = Math.max(0, tournament.timePerRound * 60 * 1000 - elapsed)
        setTimeRemaining(remaining)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [tournament])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getTopPlayers = () => {
    if (!tournament) return []
    return [...tournament.players]
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points
        // Add tiebreaker logic here
        return b.matchWins - a.matchWins
      })
      .slice(0, 3)
  }

  if (!tournament && !showPrompt) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">TCG Tournament Manager</h1>
            <p className="text-xl text-muted-foreground">Fast Swiss System Tournaments</p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Create your first tournament to begin</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/setup">
                <Button className="w-full" size="lg">
                  <Settings className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showPrompt && tournament) {
    const isCompleted = tournament.status === "completed"

    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">TCG Tournament Manager</h1>
            <p className="text-xl text-muted-foreground">Fast Swiss System Tournaments</p>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            {isCompleted ? (
              <>
                {/* New Tournament - First option when no active tournament */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Tournament</CardTitle>
                    <CardDescription>Start a fresh tournament</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/setup">
                      <Button className="w-full" size="lg">
                        <Settings className="mr-2 h-4 w-4" />
                        New Tournament
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Completed Tournament - Separate card */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <Trophy className="mr-2 h-5 w-5" />
                      Tournament Completed
                    </CardTitle>
                    <CardDescription>&quot;{tournament.name}&quot;</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/leaderboard">
                      <Button variant="outline" className="w-full" size="lg">
                        View Results
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Active/Setup Tournament */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resume Tournament</CardTitle>
                    <CardDescription>Continue the current event</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" size="lg" onClick={() => setShowPrompt(false)}>
                      <Play className="mr-2 h-4 w-4" />
                      Continue &quot;{tournament.name}&quot;
                    </Button>
                  </CardContent>
                </Card>

                {/* New Tournament option */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Tournament</CardTitle>
                    <CardDescription>Start a fresh tournament</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/setup">
                      <Button variant="outline" className="w-full" size="lg">
                        <Settings className="mr-2 h-4 w-4" />
                        New Tournament
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const topPlayers = getTopPlayers()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{tournament!.name}</h1>
          <p className="text-muted-foreground">
            Round {tournament!.currentRound} of {tournament!.rounds}
          </p>
        </div>
        <Badge variant={tournament!.status === "active" ? "default" : "secondary"}>
          {tournament!.status.charAt(0).toUpperCase() + tournament!.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament!.players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Round</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament!.currentRound}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournament!.status === "active" ? formatTime(timeRemaining) : "--:--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leader</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPlayers[0]?.nickname || "TBD"}</div>
          </CardContent>
        </Card>
      </div>

      {tournament!.status === "active" && timeRemaining > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-center text-orange-800">Round {tournament!.currentRound} in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-orange-600 mb-2">{formatTime(timeRemaining)}</div>
              <p className="text-orange-700">Time remaining this round</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>Current tournament standings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{player.nickname}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{player.points} pts</div>
                    <div className="text-sm text-muted-foreground">
                      {player.matchWins}-{player.matchLosses}-{player.matchDraws}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/players">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Players
              </Button>
            </Link>
            <Link href="/rounds">
              <Button variant="outline" className="w-full justify-start">
                <Play className="mr-2 h-4 w-4" />
                Round Management
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                View Leaderboard
              </Button>
            </Link>
            <Link href="/timer">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Round Timer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
