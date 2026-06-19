import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { eloTier } from "@/lib/elo"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Category } from "@/types"
import { Trophy, Medal, Zap } from "lucide-react"

const CATEGORIES: { value: Category | "overall"; label: string }[] = [
  { value: "overall", label: "Overall" },
  { value: "strength", label: "Strength" },
  { value: "speed", label: "Speed" },
  { value: "intelligence", label: "Intelligence" },
  { value: "durability", label: "Durability" },
  { value: "combat", label: "Combat" },
]

async function getLeaderboard() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("characters")
    .select("id, name, series, version, image_url, elo, categories")
    .eq("approved", true)
    .order("elo", { ascending: false })
    .limit(100)
  return data ?? []
}

// Helper to chunk arrays into groups of N
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results = []
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize))
  }
  return results
}

export default async function LeaderboardPage() {
  const characters = await getLeaderboard()

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 py-10">
        {/* Header & Clean Floating Legend Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Top 100 fighters ranked by current Elo
            </p>
          </div>
        </div>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="mb-8 bg-secondary/60 p-1 overflow-x-auto max-w-full justify-start md:justify-center">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs md:text-sm px-4">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => {
            const filtered =
              cat.value === "overall"
                ? characters
                : characters.filter((c) =>
                    (c.categories as string[])?.includes(cat.value)
                  )

            // Split top 3 podium from remaining fighters
            const topThree = filtered.slice(0, 3)
            const runnersUp = filtered.slice(3)

            // Group rankings 4-100 into chunks of 5
            const runnerUpGroups = chunkArray(runnersUp, 5)

            // Reorder for Podium Desktop Symmetry: [2nd, 1st, 3rd]
            const podiumOrder = 
              topThree.length === 3 
                ? [topThree[1], topThree[0], topThree[2]] 
                : topThree

            return (
              <TabsContent key={cat.value} value={cat.value} className="space-y-10 focus-visible:outline-none">
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground py-12 text-center border border-dashed rounded-xl">
                    No approved contenders found in this category yet.
                  </p>
                )}

                {/* --- 1. TOP 3 PODIUM DISPLAY --- */}
                {topThree.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6">
                    {podiumOrder.map((char) => {
                      // Determine genuine placement index within primary source array
                      const trueRank = filtered.findIndex(c => c.id === char.id) + 1
                      
                      const isFirst = trueRank === 1
                      const isSecond = trueRank === 2
                      
                      return (
                        <Link
                          key={char.id}
                          href={`/characters/${char.id}`}
                          className={`flex flex-col items-center relative rounded-2xl bg-primary/80 hover:bg-primary border p-6 
                            ${isFirst ? 'md:h-80 border-amber-500/30 ring-2 ring-amber-500/10 order-1 md:order-2' : ''}
                            ${isSecond ? 'md:h-72 order-2 md:order-1' : ''}
                            ${trueRank === 3 ? 'md:h-64 order-3 md:order-3' : ''}
                          `}
                        >
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            {isFirst && (
                              <div className="bg-amber-500 text-black p-2 rounded-full shadow-lg">
                                <Trophy className="h-5 w-5 fill-current" />
                              </div>
                            )}
                            {isSecond && (
                              <div className="bg-slate-300 text-black p-2 rounded-full shadow-md">
                                <Medal className="h-4 w-4" />
                              </div>
                            )}
                            {trueRank === 3 && (
                              <div className="bg-amber-700 text-white p-2 rounded-full shadow-sm">
                                <Medal className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          {/* Avatar Frame */}
                          <div className={`rounded-full overflow-hidden bg-muted shrink-0 shadow-inner mb-4 border-2
                            ${isFirst ? 'h-24 w-24 border-amber-500' : 'h-20 w-20 border-border'}
                          `}>
                            {char.image_url && (
                              <img
                                referrerPolicy="no-referrer"
                                src={char.image_url}
                                alt={char.name}
                                className="h-full w-full object-cover transition-transform"
                              />
                            )}
                          </div>

                          {/* Name Block */}
                          <div className="text-center w-full min-w-0 flex-1 flex flex-col justify-center">
                            <h3 className="font-bold text-accent text-xl">
                              {char.name}
                            </h3>
                            {char.version && (
                              <p className="text-l text-muted-foreground truncate font-normal">
                                {char.version}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                              {char.series}
                            </p>
                          </div>

                          {/* Score Data Summary Footer */}
                          <div className="mt-4 w-full border-t pt-3 flex items-center justify-between text-xs px-2">
                            <span className="text-muted-foreground font-mono">Rank #{trueRank}</span>
                            <div className="flex items-center gap-1 font-mono text-accent font-semibold">
                              <Zap className="h-3.5 w-3.5" />
                              {char.elo.toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* --- 2. RUNNERS UP GRID GROUPED BY 5 --- */}
                {runnerUpGroups.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {runnerUpGroups.map((group, groupIdx) => (
                      <div 
                        key={groupIdx} 
                        className="bg-background border rounded-xl overflow-hidden shadow-sm"
                      >
                        {/* Group Header Label */}
                        <div className="bg-primary/80 px-4 py-2 text-xs font-mono border-b text-muted-foreground flex justify-between">
                          <span>Ranks {4 + groupIdx * 5} - {3 + (groupIdx + 1) * 5}</span>
                          <span>Tier Range: {eloTier(group[0]?.elo)}</span>
                        </div>
                        
                        {/* 5 Row Segment Pack */}
                        <div className="divide-y">
                          {group.map((char) => {
                            const exactRank = filtered.findIndex(c => c.id === char.id) + 1
                            
                            return (
                              <Link
                                key={char.id}
                                href={`/characters/${char.id}`}
                                className="flex items-center gap-4 px-4 py-3.5 bg-secondary/50 hover:bg-primary/50 transition-colors group"
                              >
                                <span className="text-muted-foreground font-mono text-sm w-7 shrink-0 text-right group-hover:text-black">
                                  {exactRank}
                                </span>
                                
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary border shrink-0">
                                  {char.image_url && (
                                    <img
                                      referrerPolicy="no-referrer"
                                      src={char.image_url}
                                      alt={char.name}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
                                    {char.name}
                                    {char.version && (
                                      <span className="text-xs text-muted-foreground/80 ml-2 font-normal group-hover:text-black">
                                        ({char.version})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate group-hover:text-black">
                                    {char.series}
                                  </div>
                                </div>
                                
                                <div className="shrink-0 text-right font-mono pr-2">
                                  <div className="text-sm font-bold text-accent">
                                    {char.elo.toLocaleString()}
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </main>
    </>
  )
}