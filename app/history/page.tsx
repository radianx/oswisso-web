"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface TournamentSummary {
  id: string
  name: string
  status: string
  rounds: number
  currentRound: number
  players: number
  matches: number
}

export default function HistoryPage() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])

  const loadTournaments = () => {
    fetch("/api/tournaments")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTournaments(data))
  }

  useEffect(() => {
    loadTournaments()
  }, [])

  const deleteTournament = async (id: string) => {
    await fetch(`/api/tournament?id=${id}`, { method: "DELETE" })
    loadTournaments()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Archive</CardTitle>
            <CardDescription>Past tournaments and ongoing records</CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center text-muted-foreground">No tournaments found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Players</TableHead>
                    <TableHead className="text-center">Rounds</TableHead>
                    <TableHead className="text-center">Matches</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournaments.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.status}</TableCell>
                      <TableCell className="text-center">{t.players}</TableCell>
                      <TableCell className="text-center">{t.rounds}</TableCell>
                      <TableCell className="text-center">{t.matches}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/history/${t.id}`} className="inline-block">
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTournament(t.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
