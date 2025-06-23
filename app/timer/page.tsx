"use client";

import { useState, useEffect } from "react";

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
    if (timeRemaining > 0) {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Round Timer</h1>
      {tournament && (
        <div>
          <p>
            <strong>Tournament:</strong> {tournament.name}
          </p>
          <p>
            <strong>Round:</strong> {tournament.currentRound} /{" "}
            {tournament.rounds}
          </p>
        </div>
      )}
      <div className="mt-4">
        <p className="text-xl">
          Time Remaining:{" "}
          {new Date(timeRemaining).toISOString().substr(11, 8)}
        </p>
      </div>
      <div className="mt-4">
        {!isRunning && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleStart}
          >
            Start
          </button>
        )}
        {isRunning && (
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded"
            onClick={handlePauseResume}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        )}
        <button
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
