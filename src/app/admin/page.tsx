import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { Navbar } from "@/components/navbar"
import { AdminDashboard } from "./AdminDashboard"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/")

  const [{ data: pending }, { data: reports }] = await Promise.all([
    supabaseAdmin
      .from("characters")
      .select("*")
      .eq("approved", false)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("reports")
      .select("*, characters(id, name, series, version, image_url, approved)")
      .eq("resolved", false)
      .order("created_at", { ascending: false }),
  ])

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Admin</h1>
        <AdminDashboard
          pendingCharacters={pending ?? []}
          reports={reports ?? []}
        />
      </main>
    </>
  )
}
