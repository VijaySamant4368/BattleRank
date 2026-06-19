"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Upload, X } from "lucide-react"
import type { Category } from "@/types"

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "speed", label: "Speed" },
  { value: "intelligence", label: "Intelligence" },
  { value: "durability", label: "Durability" },
  { value: "power", label: "Power" },
  { value: "combat", label: "Combat" },
]

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

export default function SubmitPage() {
  const [name, setName] = useState("")
  const [series, setSeries] = useState("")
  const [version, setVersion] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [imageUrl, setImageUrl] = useState("")
  const [imagePublicId, setImagePublicId] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadLimit, setUploadLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkLimit() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("upload_limit")
        .eq("id", user.id)
        .single()
      
      setUploadLimit(profile?.upload_limit ?? 0)
      setLoading(false)
    }
    checkLimit()
  }, [supabase, router])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? "Upload failed")
      setImageUrl(data.secure_url)
      setImagePublicId(data.public_id)
      setImagePreview(data.secure_url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !series.trim()) {
      toast.error("Name and series are required")
      return
    }
    if (!imageUrl) {
      toast.error("Please upload an image")
      return
    }
    if (selectedCategories.length === 0) {
      toast.error("Select at least one category")
      return
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (uploadLimit !== null && uploadLimit <= 0) {
      toast.error("You have reached your upload limit for today.")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("characters").insert({
      name: name.trim(),
      series: series.trim(),
      version: version.trim() || null,
      description: description.trim(),
      image_url: imageUrl,
      image_public_id: imagePublicId,
      categories: selectedCategories,
      elo: 1500,
      approved: true,
      submitted_by: user.id,
      inappropriate_flagged: false,
    })

    if (error) {
      toast.error("Submission failed. Try again.")
      setSubmitting(false)
      return
    }

    // Decrement upload limit
    await supabase
      .from("profiles")
      .update({ upload_limit: (uploadLimit ?? 1) - 1 })
      .eq("id", user.id)

    toast.success("Submitted for review. Thank you!")
    router.push("/arena")
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-3 h-[60vh]">
          <Loader2 className="animate-spin h-5 w-5" />
          Checking limits...
        </div>
      </>
    )
  }

  if (uploadLimit !== null && uploadLimit <= 0) {
    return (
      <>
        <Navbar />
        <div className="max-w-xl mx-auto w-full px-4 py-20 text-center flex-1 flex flex-col justify-center">
          <h1 className="text-xl font-bold">Limit Reached</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You've reached your daily upload limit. Come back tomorrow!
          </p>
          <button
            onClick={() => router.push("/arena")}
            className="mt-6 text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            Go to Arena
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Submit a character</h1>
          <p className="text-sm text-muted-foreground mt-1">
            New submissions are reviewed before appearing in matchups.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>Character image</Label>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className={`relative border border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-foreground/30 transition-colors ${
                imagePreview ? "h-48" : "h-32"
              }`}
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    referrerPolicy="no-referrer"
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImageUrl("")
                      setImagePreview("")
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md bg-background/80 text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">
                    {uploading ? "Uploading…" : "Click to upload"}
                  </span>
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Character name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goku"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series">Series / Franchise *</Label>
              <Input
                id="series"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g. Dragon Ball Z"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version (optional)</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. Ultra Instinct"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the character and their abilities…"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label>Battle categories *</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                    selectedCategories.includes(cat.value)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      </main>
    </>
  )
}
