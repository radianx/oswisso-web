"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Play } from "lucide-react"
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

export default function SetupPage() {
  const router = useRouter()
  const [tournamentName, setTournamentName] = useState("")
  const [rounds, setRounds] = useState("4")
  const [timePerRound, setTimePerRound] = useState("50")

  const handleCreateTournament = async () => {
    if (!tournamentName.trim()) return

    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name: tournamentName.trim(),
      rounds: Number.parseInt(rounds),
      currentRound: 0,
      status: "setup",
      players: [],
      matches: [],
      timePerRound: Number.parseInt(timePerRound),
    }

    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournament),
      })
      if (res.ok) {
        router.push("/players")
      } else {
        console.error("Failed to create tournament")
      }
    } catch (err) {
      console.error("Failed to create tournament", err)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Tournament Setup</h1>
            <p className="text-muted-foreground">Configure your Swiss system tournament</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Configuration</CardTitle>
            <CardDescription>Set up the basic parameters for your tournament</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tournament-name">Tournament Name</Label>
              <Input
                id="tournament-name"
                placeholder="Enter tournament name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rounds">Number of Rounds</Label>
                <Select value={rounds} onValueChange={setRounds}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Rounds</SelectItem>
                    <SelectItem value="5">5 Rounds</SelectItem>
                    <SelectItem value="6">6 Rounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time-per-round">Time per Round (minutes)</Label>
                <Select value={timePerRound} onValueChange={setTimePerRound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="40">40 minutes</SelectItem>
                    <SelectItem value="50">50 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="75">75 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Tournament Format</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Swiss system pairing</li>
                <li>• Best of 3 matches</li>
                <li>• 3 points for win, 1 for draw, 0 for loss</li>
                <li>• Tiebreakers: OMW%, GWP%, Head-to-Head</li>
              </ul>
            </div>

            <Button onClick={handleCreateTournament} disabled={!tournamentName.trim()} className="w-full" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
