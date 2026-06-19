"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { SwipeCard, SwipeButtons } from "@/components/swipe-card"
import type { Character } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const BATCH_SIZE = 50
const MIN_KNOWN = 20

export default function OnboardingPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [knownIds, setKnownIds] = useState<string[]>([])
  const [unsavedKnownIds, setUnsavedKnownIds] = useState<string[]>([])
  const [seenIds, setSeenIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const sessionRef = useRef<{ userId: string; token: string } | null>(null)

  // Load existing known characters from database on mount, set session details
  useEffect(() => {
    async function loadInitial() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          sessionRef.current = {
            userId: session.user.id,
            token: session.access_token
          }
        }
        
        const { data, error } = await supabase
          .from("user_known_characters")
          .select("character_id")
          .eq("user_id", user.id)
        if (data && !error) {
          const ids = data.map(r => r.character_id)
          setKnownIds(ids)
        }
      }
      setIsInitialized(true)
    }
    loadInitial()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        sessionRef.current = {
          userId: session.user.id,
          token: session.access_token
        }
      } else {
        sessionRef.current = null
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const saveKnowledge = useCallback(async (idsToSave: string[]) => {
    if (idsToSave.length === 0) return true

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const rows = idsToSave.map((id) => ({
        user_id: user.id,
        character_id: id,
        source: "swipe_onboarding" as const,
      }))


      const { error } = await supabase
        .from("user_known_characters")
        .upsert(rows, {
          onConflict: "user_id,character_id",
          ignoreDuplicates: true
        })

      if (error) {
        console.error("Failed to save knowledge:", error)
        return false
      }

      setUnsavedKnownIds(prev => prev.filter(id => !idsToSave.includes(id)))
      return true
    } catch (err) {
      console.error("saveKnowledge threw:", err)
      return false
    }
  }, [supabase])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedKnownIds.length > 0) {
        if (sessionRef.current) {
          const { userId, token } = sessionRef.current
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_known_characters`
          const payload = unsavedKnownIds.map(id => ({
            user_id: userId,
            character_id: id,
            source: "swipe_onboarding"
          }))

          fetch(url, {
            method: "POST",
            headers: {
              "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(err => console.error("Unload background save failed", err))
        }

        e.preventDefault()
        e.returnValue = "You have unsaved changes. We are attempting to save them automatically, but please confirm to prevent loss."
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [unsavedKnownIds])

  const fetchBatch = useCallback(async (exclude: string[]) => {
    setLoading(true)
    const { data, error } = await supabase.rpc("get_random_characters", {
      excluded_ids: exclude,
      limit_count: BATCH_SIZE
    })

    if (error) {
      console.error("Error fetching random characters:", error)
      const { data: fallbackData } = await supabase
        .from("characters")
        .select("*")
        .eq("approved", true)
        .eq("is_deleted", false)
        .limit(BATCH_SIZE)
      if (fallbackData) {
        const filtered = fallbackData.filter(c => !exclude.includes(c.id))
        setCharacters((prev) => [...prev, ...filtered])
      }
    } else if (data) {
      setCharacters((prev) => [...prev, ...data])
    }
    setLoading(false)
  }, [supabase])

  const fetchedOnce = useRef(false)

  // Initial fetch once knownIds are loaded
  useEffect(() => {
    if (isInitialized && !fetchedOnce.current) {
      fetchBatch([])
      fetchedOnce.current = true
    }
  }, [isInitialized, fetchBatch])

  const handleSwipe = useCallback(
    async (known: boolean) => {
      const char = characters[currentIndex]
      if (!char) return

      const nextSeenIds = seenIds.includes(char.id) ? seenIds : [...seenIds, char.id]
      setSeenIds(nextSeenIds)

      let nextKnownIds = knownIds
      let nextUnsavedKnownIds = unsavedKnownIds

      if (known) {
        nextKnownIds = knownIds.includes(char.id) ? knownIds : [...knownIds, char.id]
        nextUnsavedKnownIds = unsavedKnownIds.includes(char.id) ? unsavedKnownIds : [...unsavedKnownIds, char.id]
        setKnownIds(nextKnownIds)
        setUnsavedKnownIds(nextUnsavedKnownIds)
      }

      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)

      // Auto-save: every 50 seen, or every 20 newly-marked known
      const reached50Seen = nextSeenIds.length > 0 && nextSeenIds.length % 50 === 0
      const reached20NewKnown = nextUnsavedKnownIds.length > 0 && nextUnsavedKnownIds.length % MIN_KNOWN === 0

      if ((reached50Seen || reached20NewKnown) && nextUnsavedKnownIds.length > 0) {
        saveKnowledge(nextUnsavedKnownIds).then(success => {
          if (!success) toast.error("Auto-save failed. Tap 'Save Progress' to retry.")
        })
      }

      if (nextIndex >= characters.length - 5 && !loading) {
        const allCurrentIds = characters.map((c) => c.id)
        const combinedExclude = [...new Set([...nextSeenIds, ...allCurrentIds])]
        fetchBatch(combinedExclude)
      }
    },
    [characters, currentIndex, fetchBatch, seenIds, knownIds, unsavedKnownIds, loading, saveKnowledge]
  )

  const handleSaveAndContinue = async () => {
    if (knownIds.length < MIN_KNOWN) {
      toast.error(`Mark at least ${MIN_KNOWN} characters you know first`)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }

    setSaving(true)
    try {
      const success = await saveKnowledge(unsavedKnownIds)
      if (!success) {
        toast.error("Failed to save. Try again.")
        setSaving(false)
        return
      }
      toast.success("Knowledge saved!")
      router.push("/arena")
    } catch (err) {
      console.error("handleSaveAndContinue threw:", err)
      toast.error("Failed to save. Try again.")
      setSaving(false)
    }
  }

  const handleManualSave = async () => {
    setSaving(true)
    try {
      const success = await saveKnowledge(unsavedKnownIds)
      if (success) {
        toast.success("Progress saved!")
      } else {
        toast.error("Failed to save progress.")
      }
    } catch (err) {
      console.error("handleManualSave threw:", err)
      toast.error("Failed to save progress.")
    }
    setSaving(false)
  }

  const visibleCards = characters.slice(currentIndex, currentIndex + 3)
  const progress = Math.min((knownIds.length / MIN_KNOWN) * 100, 100)
  const canFinish = knownIds.length >= MIN_KNOWN

  if (loading && characters.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading characters…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 max-w-6xl mx-auto w-full">
      <div className="w-full flex flex-col lg:flex-row gap-12 items-center">
        {/* Large Image on Left (Desktop) */}
        <div className="hidden lg:block flex-1 w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden bg-secondary relative shadow-2xl">
          <AnimatePresence mode="wait">
            {characters[currentIndex] && (
              <motion.img
                referrerPolicy="no-referrer"
                key={characters[currentIndex].id}
                src={characters[currentIndex].image_url}
                alt={characters[currentIndex].name}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg">
              {characters[currentIndex]?.name}
            </h2>
            <p className="text-xl font-bold text-primary italic">
              {characters[currentIndex]?.series}
            </p>
          </div>
        </div>

        {/* Interaction on Right */}
        <div className="flex-1 flex flex-col items-center max-w-sm w-full">
          {/* Header */}
          <div className="w-full text-center lg:text-left">
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">What do you know?</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Swipe right on characters you know. Left to skip.
            </p>

            {/* Progress bar */}
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 30 }}
              />
            </div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex justify-between">
              <span>Progress</span>
              <span>{knownIds.length} / {MIN_KNOWN} known</span>
            </div>
          </div>

          {/* Card stack */}
          <div className="relative w-full mt-10 mb-10" style={{ height: 420 }}>
            <AnimatePresence>
              {visibleCards.length > 0 ? (
                visibleCards.map((char, i) => (
                  <SwipeCard
                    key={char.id}
                    character={char}
                    index={i}
                    onSwipe={i === 0 ? handleSwipe : () => {}}
                  />
                ))
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  {loading ? "Loading more…" : "No more characters"}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="w-full space-y-4">
            <SwipeButtons
              onSkip={() => handleSwipe(false)}
              onKnow={() => handleSwipe(true)}
            />

            {unsavedKnownIds.length > 0 && (
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="w-full py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold uppercase tracking-tighter hover:bg-secondary/90 transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Progress"}
              </button>
            )}

            {canFinish && (
              <button
                onClick={handleSaveAndContinue}
                disabled={saving}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-lg font-black uppercase tracking-tighter hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Enter Arena"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
