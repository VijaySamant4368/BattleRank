import Link from "next/link"
import { Swords, ChevronRight, Shield, Zap, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { LANDING_IMAGES } from "@/lib/constants"
import { Navbar } from "@/components/navbar"

async function getStats() {
  const supabase = await createClient()
  const [{ count: characters }, { count: votes }] = await Promise.all([
    supabase.from("characters").select("*", { count: "exact", head: true }).eq("approved", true),
    supabase.from("votes").select("*", { count: "exact", head: true }),
  ])
  return { characters: characters ?? 0, votes: votes ?? 0 }
}

async function getTopCharacters() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("characters")
    .select("id, name, series, elo, image_url")
    .eq("approved", true)
    .order("elo", { ascending: false })
    .limit(5)
  return data ?? []
}

export default async function Home() {
  const [stats, top] = await Promise.all([getStats(), getTopCharacters()])
  
  // Randomly select two images for versus display
  const shuffled = [...LANDING_IMAGES].sort(() => 0.5 - Math.random())
  const img1 = shuffled[0]
  const img2 = shuffled[1]

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar />
      {/* Hero with Versus Layout */}
      {/* Hero with Versus Layout */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center overflow-hidden">
        
        {/* Background Versus Images */}
        <div className="absolute inset-0 z-0">
          
          {/* Left Side */}
          <div className="absolute inset-0 group [clip-path:polygon(0_0,100%_0,100%_50%,0_50%)] lg:[clip-path:polygon(0_0,55%_0,45%_100%,0_100%)] animate-clash-left">
            <div 
              className="absolute top-0 bottom-0 left-0 w-full lg:w-[60%] brightness-[0.3] transition-all duration-1000 group-hover:brightness-[0.8]"
              style={{ backgroundImage: `url(${img1})`, backgroundSize: 'cover', backgroundPosition: 'center 20%' }}
            />
            <div className="absolute inset-0 bg-primary/40 mix-blend-color z-10 transition-opacity duration-1000 group-hover:opacity-0" />
          </div>

          {/* Right Side */}
          <div className="absolute inset-0 group [clip-path:polygon(0_50%,100%_50%,100%_100%,0_100%)] lg:[clip-path:polygon(55%_0,100%_0,100%_100%,45%_100%)] animate-clash-right">
            <div 
              className="absolute top-0 bottom-0 right-0 w-full lg:w-[60%] brightness-[0.3] transition-all duration-1000 group-hover:brightness-[0.8]"
              style={{ backgroundImage: `url(${img2})`, backgroundSize: 'cover', backgroundPosition: 'center 20%' }}
            />
            <div className="absolute inset-0 bg-secondary/40 mix-blend-color z-10 transition-opacity duration-1000 group-hover:opacity-0" />
          </div>
        </div>

        {/* The Exact Diagonal Divider Line */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-0 animate-[fade-in_0.5s_ease-out_0.6s_forwards]">
          {/* Mobile: Simple horizontal border */}
          <div className="block lg:hidden absolute top-1/2 left-0 right-0 h-px bg-border" />
          
          {/* Desktop: SVG line that perfectly maps the 55% to 45% clip-path coordinates */}
          <svg className="hidden lg:block absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="55%" y1="0" x2="45%" y2="100%" className="stroke-border drop-shadow-[0_0_8px_rgba(var(--foreground),0.5)]" strokeWidth="3" />
          </svg>
        </div>

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 py-24 max-w-4xl mx-auto w-full pointer-events-none">
          
          {/* Text Container with Slam Animation */}
          <div className="flex flex-col items-center mb-8 pointer-events-auto animate-clash-text">
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-none mb-2 italic drop-shadow-2xl">
              V<span className="text-accent text-7xl md:text-8xl">/</span>S
            </h1>
            <p className="text-2xl md:text-4xl font-bold tracking-tight text-accent drop-shadow-lg ">
              WHO WINS?
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full px-4 py-16 flex flex-col items-center">

          <p className="text-lg text-foreground/80 mb-12 leading-relaxed bg-background/60 backdrop-blur-md p-4 rounded-xl">
            Crowdsourced rankings for fictional characters. Vote only on matchups
            involving characters you actually know.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/arena"
              className="flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-bold text-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            >
              Enter Arena
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center justify-center gap-2 px-10 py-4 bg-secondary/50 backdrop-blur-md border border-border text-lg font-bold text-foreground hover:bg-secondary/80 transition-all"
            >
              View Leaderboard
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-20 text-center bg-background/60 backdrop-blur-md p-6 rounded-2xl border border-border">
            <div>
              <div className="text-3xl font-black elo-number text-primary">{stats.characters.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Characters</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-3xl font-black elo-number text-accent">{stats.votes.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Votes cast</div>
            </div>
          </div>
      </section>


      {/* Top 5 snapshot */}
      {top.length > 0 && (
        <section className="border-t border-border py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Current top 5
              </h2>
              <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Full leaderboard →
              </Link>
            </div>
            <ol className="space-y-2">
              {top.map((char, i) => (
                <li key={char.id}>
                  <Link
                    href={`/characters/${char.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-muted-foreground text-sm w-4 shrink-0 elo-number">
                      {i + 1}
                    </span>
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary shrink-0">
                      {char.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          referrerPolicy="no-referrer"
                          src={char.image_url}
                          alt={char.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{char.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{char.series}</div>
                    </div>
                    <div className="text-sm font-mono text-accent elo-number shrink-0">
                      {char.elo.toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t border-border py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-10">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center mb-4">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Mark what you know</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Swipe through characters. Mark the ones you&apos;re familiar with.
                You only vote on matchups between known characters.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center mb-4">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Vote on matchups</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Head-to-head battles between similarly-rated characters. Pick the
                winner or skip if you&apos;re unsure.
              </p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Elo settles debates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ratings update after every vote. The more votes, the more
                accurate the ranking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>PowerScale</span>
          <Link href="/submit" className="hover:text-foreground transition-colors">
            Submit a character
          </Link>
        </div>
      </footer>
    </main>
  )
}
