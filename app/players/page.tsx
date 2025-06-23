"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/useDebounce";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Users, Play } from "lucide-react";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  rounds: number;
  currentRound: number;
  status: "setup" | "active" | "completed";
  players: Player[];
  matches: Match[];
  timePerRound: number;
  roundStartTime?: number;
}

interface Player {
  id: string;
  nickname: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  opponentIds: string[];
}

interface Match {
  id: string;
  round: number;
  player1Id: string;
  player2Id: string;
  player1Points?: number;
  player2Points?: number;
  result?: "player1" | "player2" | "draw";
  gameResults?: ("player1" | "player2")[];
  isBye?: boolean;
}

export default function PlayersPage() {
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editedName, setEditedName] = useState("")
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetch("/api/tournament")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTournament(data);
        } else {
          router.push("/setup");
        }
      });
  }, [router]);

  const saveTournament = (updatedTournament: Tournament) => {
    setTournament(updatedTournament);
    fetch("/api/tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTournament),
    });
  };

  const addPlayer = () => {
    if (!tournament || !newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      nickname: newPlayerName.trim(),
      points: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      gameWins: 0,
      gameLosses: 0,
      opponentIds: [],
    };

    const updatedTournament = {
      ...tournament,
      players: [...tournament.players, newPlayer],
    };

    saveTournament(updatedTournament);
    setNewPlayerName("");
  };

  const removePlayer = (playerId: string) => {
    if (!tournament || tournament.status !== "setup") return;

    const updatedTournament = {
      ...tournament,
      players: tournament.players.filter((p) => p.id !== playerId),
    };

    saveTournament(updatedTournament);
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id)
    setEditedName(player.nickname)
  }

  const cancelEditing = () => {
    setEditingPlayerId(null)
    setEditedName("")
  }

  const saveEditedName = () => {
    if (!tournament || !editingPlayerId || !editedName.trim()) return

    const updatedPlayers = tournament.players.map((p) =>
      p.id === editingPlayerId ? { ...p, nickname: editedName.trim() } : p,
    )

    const updatedTournament = {
      ...tournament,
      players: updatedPlayers,
    }

    saveTournament(updatedTournament)
    cancelEditing()
  }

  const startTournament = () => {
    if (!tournament || tournament.players.length < 2) return;

    const updatedTournament = {
      ...tournament,
      status: "active" as const,
      currentRound: 1,
    };

    saveTournament(updatedTournament);
    router.push("/rounds");
  };

  if (!tournament) {
    return <div>Loading...</div>;
  }

  const filteredPlayers = tournament.players.filter((p) =>
    p.nickname.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

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
              <h1 className="text-3xl font-bold">Player Management</h1>
              <p className="text-muted-foreground">{tournament.name}</p>
            </div>
          </div>
          <Badge variant="secondary">{tournament.players.length} Players</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Registered Players
                </CardTitle>
                <CardDescription>
                  Players registered for this tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search players"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                {tournament.players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No players registered yet. Add players to get started.
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No players match your search.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          {editingPlayerId === player.id ? (
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && saveEditedName()}
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium">{player.nickname}</span>
                          )}
                        </div>
                        {editingPlayerId === player.id ? (
                          <div className="space-x-2">
                            <Button size="sm" onClick={saveEditedName} disabled={!editedName.trim()}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => startEditing(player)}>
                              Edit
                            </Button>
                            {tournament.status === "setup" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePlayer(player.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
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
                <CardTitle>Add Player</CardTitle>
                <CardDescription>
                  Register a new player for the tournament
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="player-name">Player Nickname</Label>
                  <Input
                    id="player-name"
                    placeholder="Enter nickname"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                  />
                </div>
                <Button
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim()}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Player
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Players:</span>
                    <span className="font-medium">
                      {tournament.players.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rounds:</span>
                    <span className="font-medium">{tournament.rounds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time per Round:</span>
                    <span className="font-medium">
                      {tournament.timePerRound} min
                    </span>
                  </div>
                </div>

                {tournament.players.length >= 2 &&
                  tournament.status === "setup" && (
                    <Button
                      onClick={startTournament}
                      className="w-full"
                      size="lg"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Tournament
                    </Button>
                  )}

                {tournament.players.length < 2 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Add at least 2 players to start the tournament
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
