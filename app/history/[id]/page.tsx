"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"

interface Player {
  id: string
  nickname: string
}

interface Match {
  id: string
  round: number
  player1Id: string
  player2Id: string
  result?: "player1" | "player2" | "draw"
  isBye?: boolean
}

interface Tournament {
  id: string
  name: string
  rounds: number
  currentRound: number
  status: "setup" | "active" | "completed"
  players: Player[]
  matches: Match[]
  timePerRound: number
}

export default function TournamentHistoryPage() {
  const params = useParams()
  const id = params.id as string
  const [tournament, setTournament] = useState<Tournament | null>(null)

  useEffect(() => {
    fetch(`/api/tournament?id=${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTournament(data))
  }, [id])

  const getPlayerName = (playerId: string) => {
    return tournament?.players.find((p) => p.id === playerId)?.nickname || "Unknown"
  }

  const exportMatches = () => {
    if (!tournament) return
    const headers = ["Round", "Player 1", "Player 2", "Result"]
    const rows = tournament.matches.map((m) => {
      const result = m.isBye
        ? "Bye"
        : m.result === "draw"
          ? "Draw"
          : m.result
          ? `${getPlayerName(m.result === "player1" ? m.player1Id : m.player2Id)} Wins`
          : ""
      return [
        m.round.toString(),
        getPlayerName(m.player1Id),
        m.isBye ? "BYE" : getPlayerName(m.player2Id),
        result,
      ]
    })
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${tournament.name}_matches.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!tournament) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Link href="/history">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Match History</h1>
            <p className="text-muted-foreground">{tournament.name}</p>
          </div>
        </div>
        <Button onClick={exportMatches} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>All recorded matches</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Player 1</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.round}</TableCell>
                    <TableCell>{getPlayerName(m.player1Id)}</TableCell>
                    <TableCell>{m.isBye ? "BYE" : getPlayerName(m.player2Id)}</TableCell>
                    <TableCell>
                      {m.isBye
                        ? "Bye"
                        : m.result === "draw"
                        ? "Draw"
                        : m.result
                        ? `${getPlayerName(m.result === "player1" ? m.player1Id : m.player2Id)} Wins`
                        : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
