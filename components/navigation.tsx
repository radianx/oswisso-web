"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, Users, Play, Trophy, Clock, Settings, Menu, Gamepad2, History } from "lucide-react"

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

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/players", label: "Players", icon: Users },
  { href: "/rounds", label: "Rounds", icon: Play },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/timer", label: "Timer", icon: Clock },
  { href: "/history", label: "History", icon: History },
  { href: "/setup", label: "Setup", icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetch("/api/tournament")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setTournament(data)
      })
  }, [pathname]) // Re-check when route changes

  const NavItems = ({ mobile = false }) => (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link key={item.href} href={item.href} onClick={() => mobile && setIsOpen(false)}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`${mobile ? "w-full justify-start" : ""} ${
                isActive ? "" : "text-muted-foreground hover:text-foreground"
              }`}
              size={mobile ? "default" : "sm"}
            >
              <Icon className={`h-4 w-4 ${mobile ? "mr-2" : ""}`} />
              {mobile && item.label}
            </Button>
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6" />
              <span className="font-bold text-xl">TCG Tournament</span>
            </Link>

            {tournament && (
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="outline">{tournament.name}</Badge>
                <Badge variant={tournament.status === "active" ? "default" : "secondary"}>
                  {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </Badge>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavItems />
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                <div className="space-y-2">
                  <h3 className="font-semibold">Navigation</h3>
                  <div className="space-y-1">
                    <NavItems mobile />
                  </div>
                </div>

                {tournament && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-semibold">Tournament Info</h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Name: </span>
                        <span className="font-medium">{tournament.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Status: </span>
                        <Badge variant={tournament.status === "active" ? "default" : "secondary"} className="text-xs">
                          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Round: </span>
                        <span className="font-medium">
                          {tournament.currentRound} / {tournament.rounds}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Players: </span>
                        <span className="font-medium">{tournament.players.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
