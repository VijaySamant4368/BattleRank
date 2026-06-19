"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { updateCharacter, deleteCharacter } from "../actions"
import { toast } from "sonner"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import type { Character, Category } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "speed", label: "Speed" },
  { value: "intelligence", label: "Intelligence" },
  { value: "durability", label: "Durability" },
  { value: "power", label: "Power" },
  { value: "combat", label: "Combat" },
]

type SortField = "created_at" | "name" | "elo"
type SortOrder = "asc" | "desc"

type CharacterPreview = Pick<
  Character,
  "id" | "name" | "series" | "version" | "image_url" | "categories" | "elo" | "description" | "created_at"
>

export default function SubmissionsPage() {
  const [characters, setCharacters] = useState<CharacterPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CharacterPreview | null>(null)
  const [editDesc, setEditDesc] = useState("")
  const [editCats, setEditCats] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  
  // Sorting States
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const supabase = createClient()

  const fetchSubmissions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("characters")
      .select("id, name, series, version, image_url, description, categories, elo, created_at")
      .eq("submitted_by", user.id)
      .eq("is_deleted", false)

    setCharacters((data as CharacterPreview[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleUpdate = async () => {
    if (!editing) return
    setSubmitting(true)
    try {
      await updateCharacter(editing.id, {
        description: editDesc,
        categories: editCats
      })
      toast.success("Character updated")
      setEditing(null)
      fetchSubmissions()
    } catch (err) {
      toast.error("Failed to update")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This character will no longer appear in matchups.")) return
    try {
      await deleteCharacter(id)
      toast.success("Character deleted")
      fetchSubmissions()
    } catch (err) {
      toast.error("Failed to delete")
    }
  }

  const toggleCat = (cat: Category) => {
    setEditCats(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const sortedCharacters = [...characters].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]

    if (sortField === "created_at") {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue)
    }

    if ((aValue ?? 0) < (bValue ?? 0)) return sortOrder === "asc" ? -1 : 1
    if ((aValue ?? 0) > (bValue ?? 0)) return sortOrder === "asc" ? 1 : -1
    return 0
  })

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
      <main className="max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-black tracking-tight uppercase">My Submissions</h1>
          
          {/* Sorting Controller Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground mr-2 font-medium uppercase tracking-wider">Sort by:</span>
            <Button 
              variant={sortField === "created_at" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => toggleSort("created_at")}
              className="h-8 px-3 rounded-none font-semibold"
            >
              Date {sortField === "created_at" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button 
              variant={sortField === "name" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => toggleSort("name")}
              className="h-8 px-3 rounded-none font-semibold"
            >
              Name {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button 
              variant={sortField === "elo" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => toggleSort("elo")}
              className="h-8 px-3 rounded-none font-semibold"
            >
              ELO {sortField === "elo" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
          </div>
        </div>

        {/* Two items per line structure with open, box-free spacing layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12">
          {sortedCharacters.length === 0 ? (
            <p className="text-muted-foreground col-span-2 py-8 italic">You haven't submitted any characters yet.</p>
          ) : (
            sortedCharacters.map((c) => (
              <div key={c.id} className="flex gap-6 pb-6 border-b border-border/30 items-start hover:bg-primary/30">
                <div className="h-24 w-24 overflow-hidden flex-shrink-0 bg-muted">
                  <img 
                    referrerPolicy="no-referrer" 
                    src={c.image_url} 
                    alt={c.name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <Link href={`/characters/${c.id}`} className="min-w-0 block">
                          <h3 className="font-bold text-xl tracking-tight truncate leading-tight hover:underline">
                            {c.name} {c.version && <span className="text-muted-foreground font-normal text-sm block lg:inline lg:ml-1">{c.version}</span>} 
                          </h3>
                        </Link>
                        <h2 className="font-bold text-m tracking-tight truncate leading-tight">
                          {c.series}
                        </h2>
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="elo-number font-mono tracking-wider text-foreground font-semibold">
                            ELO {c.elo}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(c.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        <button 
                          onClick={() => {
                            setEditing(c)
                            setEditDesc(c.description ?? "")
                            setEditCats(c.categories as Category[] ?? [])
                          }}
                          className="p-1.5 hover:text-foreground text-muted-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(c.categories as string[])?.map(cat => (
                      <span key={cat} className="px-2 py-0.5 border border-border/60 text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-none border-2 border-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Edit Character</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold">Description</Label>
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-input border border-border focus:border-foreground outline-none resize-none rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-bold">Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCat(cat.value)}
                    className={`px-3 py-1.5 text-xs font-bold border transition-colors rounded-none ${
                      editCats.includes(cat.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-none font-bold" onClick={() => setEditing(null)}>Cancel</Button>
            <Button className="rounded-none font-bold" onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}