import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { eloTier } from "@/lib/elo"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("characters")
    .select("name, series, elo, image_url")
    .eq("id", id)
    .single()

  if (!data) return { title: "Character not found" }

  return {
    title: `${data.name} — PowerScale`,
    description: `${data.name} from ${data.series}. Current Elo: ${data.elo}`,
    openGraph: {
      title: `${data.name} | ${data.series}`,
      description: `Elo: ${data.elo} · ${eloTier(data.elo)}`,
      images: data.image_url ? [data.image_url] : [],
    },
  }
}

export default async function CharacterPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: character }, { count: wins }, { count: losses }] =
    await Promise.all([
      supabase.from("characters").select("*").eq("id", id).single(),
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("winner_id", id)
        .eq("skipped", false),
      supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("loser_id", id),
    ])

  if (!character) notFound()

  const totalVotes = (wins ?? 0) + (losses ?? 0)
  const winRate = totalVotes > 0 ? Math.round(((wins ?? 0) / totalVotes) * 100) : null

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-4 py-10">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Leaderboard
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Only for Desktop (The image on left thingy*/}
          <div className="flex-1 w-full lg:max-w-lg aspect-[3/4] rounded-3xl overflow-hidden bg-secondary relative shadow-2xl group">
            {character.image_url && !character.inappropriate_flagged && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                referrerPolicy="no-referrer"
                src={character.image_url}
                alt={character.name}
                className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex-1 min-w-0 py-4">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-tight mb-2">
              {character.name}
            </h1>
            {character.version && (
              <h3 className="text-5xl md:text-7l font-black italic tracking-tighter uppercase leading-tight mb-2">
                {character.version}
              </h3>)
            }
            
            <div className="text-2xl font-bold text-primary italic mb-6">
              {character.series}
            </div>

            <div className="mb-10 flex items-baseline gap-4">
              <span className="text-7xl font-black elo-number text-accent italic">
                {character.elo.toLocaleString()}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Elo Rating</span>
                <span className="text-lg font-bold text-primary italic">{eloTier(character.elo)}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <div className="text-3xl font-black elo-number text-white italic">{(wins ?? 0).toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Wins</div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <div className="text-3xl font-black elo-number text-white italic">{(losses ?? 0).toLocaleString()}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Losses</div>
              </div>
              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <div className="text-3xl font-black elo-number text-primary italic">
                  {winRate !== null ? `${winRate}%` : "—"}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Win rate</div>
              </div>
            </div>

            {/* Categories */}
            {character.categories?.length > 0 && (
              <div className="mb-10">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                  Battle Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {(character.categories as string[]).map((cat) => (
                    <Badge key={cat} variant="secondary" className="capitalize px-4 py-1 font-bold italic bg-primary/10 text-primary border-primary/20">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {character.description && (
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
                  Character Dossier
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed italic font-medium max-w-xl">
                  {character.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
