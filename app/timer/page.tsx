"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  result?: "player1" | "player2" | "draw";
  gameResults?: ("player1" | "player2")[];
  isBye?: boolean;
}

export default function TimerPage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const hasPairings =
    tournament?.matches.some((m) => m.round === tournament.currentRound) || false;

  useEffect(() => {
    fetch("/api/tournament")
      .then((res) => (res.ok ? res.json() : null))
      .then((parsed) => {
        if (parsed) {
          setTournament(parsed);

          if (parsed.roundStartTime) {
            const elapsed = Date.now() - parsed.roundStartTime;
            const remaining = Math.max(
              0,
              parsed.timePerRound * 60 * 1000 - elapsed
            );
            setTimeRemaining(remaining);
            setIsRunning(remaining > 0);
          } else {
            setTimeRemaining(parsed.timePerRound * 60 * 1000);
          }
        }
      });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1000);
          if (newTime === 0) {
            setIsRunning(false);
            playNotificationSound();
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeRemaining]);

  const playNotificationSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRiIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAA//8AAABCAAAAQEAAAAAAAECAgEAAAABAQECAgICAgICAgICAgICAgICAgICAgICAgICAgICA=="
    );
    audio.play().catch((err) => console.error("Audio play failed:", err));
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    if (tournament) {
      setTimeRemaining(tournament.timePerRound * 60 * 1000);
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const handleStart = () => {
    if (timeRemaining > 0 && hasPairings) {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/rounds">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Round Timer</h1>
            {tournament && (
              <p className="text-muted-foreground">
                {tournament.name} – Round {tournament.currentRound} / {tournament.rounds}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Time Remaining</CardTitle>
            <CardDescription className="text-center">
              {hasPairings
                ? "Manage the current round's time"
                : "Generate pairings before starting the timer"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold">
                {new Date(timeRemaining).toISOString().substr(11, 8)}
              </div>
            </div>
            <div className="flex justify-center space-x-2">
              {!isRunning ? (
                <Button onClick={handleStart} disabled={!hasPairings}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </Button>
              ) : (
                <Button variant="secondary" onClick={handlePauseResume}>
                  {isPaused ? (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Resume
                    </>
                  ) : (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
