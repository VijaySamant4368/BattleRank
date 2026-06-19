"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Loader2 } from "lucide-react"
import Link from "next/link"

type VoteWithCharacters = {
  id: string
  created_at: string
  skipped: boolean
  winner: { id: string; name: string; series: string } | null
  loser: { id: string; name: string; series: string } | null
}

export default function VotesPage() {
  const [votes, setVotes] = useState<VoteWithCharacters[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchVotes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("votes")
        .select(`
          id,
          created_at,
          skipped,
          winner:winner_id(id, name, series),
          loser:loser_id(id, name, series)
        `)
        .eq("voter_id", user.id)
        .order("created_at", { ascending: false })

      setVotes((data as any) ?? [])
      setLoading(false)
    }
    fetchVotes()
  }, [supabase])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 tracking-tight text-foreground">My Vote History</h1>

        <div className="space-y-4">
          {votes.length === 0 ? (
            <p className="text-muted-foreground">You haven't voted on any matchups yet.</p>
          ) : (
            votes.map((v, i) => {
              const isEvenRow = i % 2 === 0
              
              // Define backdrop panels
              const leftBg = isEvenRow ? "bg-primary/80" : "bg-secondary/80"
              const rightBg = isEvenRow ? "bg-secondary/80" : "bg-primary/80"

              const leftTextClass = isEvenRow ? "text-primary-foreground" : "text-secondary-foreground"
              const leftMutedClass = isEvenRow ? "text-primary-foreground/70" : "text-secondary-foreground/70"

              const rightTextClass = isEvenRow ? "text-secondary-foreground" : "text-primary-foreground"
              const rightMutedClass = isEvenRow ? "text-secondary-foreground/70" : "text-primary-foreground/70"

              return (
                <div 
                  key={v.id} 
                  className="group relative border border-border rounded-none overflow-hidden flex flex-col md:flex-row transition-colors"
                >
                  <div 
                    className={`flex-1 p-5 pr-8 md:pr-16 transition-colors relative z-0 ${leftBg}`}
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)"
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-widest text-accent dark:text-emerald-300 uppercase block mb-1 drop-shadow-sm">
                      Winner
                    </span>
                    {v.winner ? (
                      <Link 
                        href={`/characters/${v.winner.id}`}
                        className={`text-base font-bold truncate block hover:underline transition-all w-fit max-w-full ${leftTextClass}`}
                      >
                        {v.winner.name}
                      </Link>
                    ) : (
                      <span className={`text-base font-bold truncate block ${leftMutedClass}`}>Unknown</span>
                    )}
                    <span className={`text-xs truncate block mt-0.5 ${leftMutedClass}`}>
                      {v.winner?.series || "N/A"}
                    </span>
                  </div>

                  <div 
                    className={`flex-1 p-5 pl-8 md:pl-16 md:pr-40 transition-colors text-left md:text-right -mt-4 md:mt-0 md:-ml-[8%] relative z-10 ${rightBg}`}
                    style={{
                      clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0 100%)"
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-widest text-accent uppercase block mb-1 drop-shadow-sm">
                      Loser
                    </span>
                    {v.loser ? (
                      <Link 
                        href={`/characters/${v.loser.id}`}
                        className={`text-base font-bold truncate block hover:underline transition-all w-fit md:ml-auto max-w-full ${rightTextClass}`}
                      >
                        {v.loser.name}
                      </Link>
                    ) : (
                      <span className={`text-base font-bold truncate block ${rightMutedClass}`}>Unknown</span>
                    )}
                    <span className={`text-xs truncate block mt-0.5 ${rightMutedClass}`}>
                      {v.loser?.series || "N/A"}
                    </span>
                  </div>

                  <div className="relative md:absolute md:top-0 md:right-0 md:h-full flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 p-3 md:p-4 bg-background border-t md:border-t-0 md:border-l border-border rounded-none min-w-full md:min-w-[140px] shrink-0 z-20">
                    <span className="text-xl text-muted-foreground font-mono font-medium">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </>
  )
}