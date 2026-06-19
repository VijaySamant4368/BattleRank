"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { MatchupCard, ReportButton } from "@/components/matchup-card"
import { Navbar } from "@/components/navbar"
import type { Character, Matchup } from "@/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SkipForward, Loader2, Save } from "lucide-react"

const POOL_SIZE = 20

type PendingVote = {
  winnerId: string
  loserId: string | null
  skipped: boolean
}

export default function ArenaPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [result, setResult] = useState<"a" | "b" | "skip" | null>(null)
  
  // Batching & Limits State
  const [pendingVotes, setPendingVotes] = useState<PendingVote[]>([])
  const [votesLeft, setVotesLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [maxAllowedVotes, setMaxAllowedVotes] = useState<number>(0)
  
  // Track initial pull so useEffect only runs once safely
  const isInitialFetched = useRef(false)

  const fetchPool = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }

    const [profileRes, knownDataRes, exposedRes] = await Promise.all([
      supabase.from("profiles").select("vote_limit").eq("id", user.id).single(),
      supabase.from("user_known_characters").select("character_id").eq("user_id", user.id),
      supabase.from("votes").select("winner_id, loser_id").eq("voter_id", user.id).order("created_at", { ascending: false }).limit(200)
    ]);

    const limit = profileRes.data?.vote_limit ?? 0
    setMaxAllowedVotes(limit)
    setVotesLeft(limit)

    if (limit <= 0) {
      setMatchups([])
      setLoading(false)
      return
    }

    const knownData = knownDataRes.data;
    if (!knownData || knownData.length < 2) {
      router.push("/onboarding")
      return
    }

    const knownIds = knownData.map((r) => r.character_id)
    const recentPairs = new Set(
      (exposedRes.data ?? []).map((e) =>
        [e.winner_id, e.loser_id].sort().join(":")
      )
    )

    const { data: characters } = await supabase
      .from("characters")
      .select("*")
      .in("id", knownIds)
      .eq("approved", true)
      .order("elo", { ascending: false })

    if (!characters || characters.length < 2) {
      toast.info("Know more characters to get matchups!")
      router.push("/onboarding")
      return
    }

    const pool: Matchup[] = []
    const used = new Set<string>()
    let attempts = 0
    
    // Safety exit rule added to prevent CPU infinite hang loops
    while (pool.length < POOL_SIZE && attempts < 1000) {
      attempts++
      const a = characters[Math.floor(Math.random() * characters.length)]
      const b = characters[Math.floor(Math.random() * characters.length)]

      if (a.id === b.id) continue

      const pairKey = [a.id, b.id].sort().join(":")

      if (used.has(pairKey)) continue
      if (recentPairs.has(pairKey)) continue
      if (Math.abs(a.elo - b.elo) > 400) continue

      used.add(pairKey)
      pool.push({ characterA: a, characterB: b })
    }

    if (pool.length === 0) {
      toast.info("No fresh closely matched pairs found right now.")
    }

    setMatchups(pool.sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setLoading(false)
  }, [supabase, router])

  // Fix: Safe initial mount load check
  useEffect(() => {
    if (!isInitialFetched.current) {
      isInitialFetched.current = true
      fetchPool()
    }
  }, [fetchPool])

  // Warn user if they try to close/reload with pending votes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingVotes.length > 0 && !isSubmitting) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [pendingVotes.length, isSubmitting])

  // Batch Submit Function
  const submitBatch = useCallback(async (votesToSubmit: PendingVote[]) => {
    if (votesToSubmit.length === 0) return

    setIsSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const payload = votesToSubmit.map(v => ({
        voter_id: user.id,
        winner_id: v.winnerId,
        loser_id: v.loserId,
        skipped: v.skipped,
      }))

      const { error } = await supabase.rpc('submit_votes_batch', { payload })

      if (error) {
        toast.error("Failed to save some votes.")
        console.error(error)
      } else {
        toast.success(`Saved ${votesToSubmit.length} matches!`)
      }
    }

    setPendingVotes([])
    setIsSubmitting(false)
    await fetchPool()
  }, [supabase, fetchPool])

  // Advance through the pool locally
  const advance = useCallback(
    async (vote: PendingVote) => {
      const newPending = [...pendingVotes, vote]
      setPendingVotes(newPending)
      
      const newVotesLeft = (votesLeft ?? 1) - 1
      setVotesLeft(newVotesLeft)
      const nextIndex = currentIndex + 1

      if (newVotesLeft <= 0 || nextIndex >= matchups.length) {
        await submitBatch(newPending)
      } else {
        setCurrentIndex(nextIndex)
        setResult(null)
      }
    },
    [currentIndex, matchups.length, pendingVotes, votesLeft, submitBatch]
  )

  const handleVote = useCallback(async (winner: "a" | "b") => {
    const matchup = matchups[currentIndex]
    if (!matchup) return

    setResult(winner)
    const isA = winner === "a"
    const w = isA ? matchup.characterA : matchup.characterB
    const l = isA ? matchup.characterB : matchup.characterA

    await new Promise((r) => setTimeout(r, 600))
    await advance({
      winnerId: w.id,
      loserId: l.id,
      skipped: false,
    })
  }, [currentIndex, matchups, advance])

  // Skip completely locally without updating DB or modifying limits
  const handleSkip = useCallback(async () => {
    const matchup = matchups[currentIndex]
    if (!matchup) return

    setResult("skip")
    await new Promise((r) => setTimeout(r, 300))
    const nextIndex = currentIndex + 1

    if (nextIndex >= matchups.length) {
      if (pendingVotes.length > 0) {
        await submitBatch(pendingVotes)
      } else {
        await fetchPool()
      }
    } else {
      setCurrentIndex(nextIndex)
      setResult(null)
    }
  }, [currentIndex, matchups, pendingVotes, submitBatch, fetchPool])

  const submitReport = async (reason: string) => {
    if (!reportTarget) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("reports").insert({
      reporter_id: user.id,
      character_id: reportTarget,
      reason,
    })

    if (reason === "inappropriate_image") {
      await supabase
        .from("characters")
        .update({ inappropriate_flagged: true })
        .eq("id", reportTarget)
    }

    toast.success("Reported. Thank you.")
    setReportTarget(null)
  }

  if (loading || isSubmitting) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-3">
          <Loader2 className="animate-spin h-5 w-5" />
          {isSubmitting ? "Saving your votes..." : "Finding matchups…"}
        </div>
      </>
    )
  }

  if (votesLeft !== null && votesLeft <= 0) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-xl font-semibold">You're out of votes for today!</p>
          <p className="text-muted-foreground">Check back tomorrow for more matchups.</p>
        </div>
      </>
    )
  }

  const matchup = matchups[currentIndex]

  if (!matchup) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-muted-foreground">No matchups available right now.</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            Expand your knowledge base
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-medium text-muted-foreground">
            {votesLeft} votes left
          </span>

          <div className="h-0.5 flex-1 mx-6 bg-secondary overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ 
                width: `${maxAllowedVotes > 0 
                  ? (Math.max(0, maxAllowedVotes - (votesLeft || 0)) / maxAllowedVotes) * 100 
                  : 0}%` 
              }}
            />
          </div>

          <div className="flex items-center gap-4">
            {pendingVotes.length > 0 && (
              <button
                onClick={() => submitBatch(pendingVotes)}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                title="Save progress and quit early"
              >
                <Save className="h-3.5 w-3.5" />
                Save early
              </button>
            )}
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
          </div>
        </div>

        <p className="text-center text-sm font-medium mb-6">Who wins in a fight?</p>

        <div className="flex gap-3 flex-1">
          <div className="flex-1 flex flex-col">
            <MatchupCard
              character={matchup.characterA}
              onClick={() => handleVote("a")}
              disabled={result !== null}
              result={result === "a" ? "winner" : result !== null && result !== "skip" ? "loser" : null}
            />
            <div className="flex justify-end mt-1">
              <ReportButton
                characterId={matchup.characterA.id}
                onReport={setReportTarget}
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">VS</span>
          </div>

          <div className="flex-1 flex flex-col">
            <MatchupCard
              character={matchup.characterB}
              onClick={() => handleVote("b")}
              disabled={result !== null}
              result={result === "b" ? "winner" : result !== null && result !== "skip" ? "loser" : null}
            />
            <div className="flex justify-end mt-1">
              <ReportButton
                characterId={matchup.characterB.id}
                onReport={setReportTarget}
              />
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report character</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { value: "duplicate_entry", label: "Duplicate entry" },
              { value: "joke_character", label: "Joke character" },
              { value: "wrong_version", label: "Wrong version" },
              { value: "character_does_not_exist", label: "Character does not exist" },
              { value: "copyright_image", label: "Copyrighted image" },
              { value: "inappropriate_image", label: "Inappropriate image (NSFW/Gore)" },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => submitReport(r.value)}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}