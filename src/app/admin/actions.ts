"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/")
  return
}

export async function approveCharacter(id: string) {
  await assertAdmin()
  await supabaseAdmin.from("characters").update({ approved: true }).eq("id", id)
}

export async function rejectCharacter(id: string) {
  await assertAdmin()
  await supabaseAdmin.from("characters").delete().eq("id", id)
}

export async function resolveReport(id: string) {
  await assertAdmin()
  await supabaseAdmin.from("reports").update({ resolved: true }).eq("id", id)
}

export async function resolveAndApprove(reportId: string, characterId: string) {
  await assertAdmin()
  await Promise.all([
    supabaseAdmin.from("reports").update({ resolved: true }).eq("id", reportId),
    supabaseAdmin.from("characters").update({ approved: true }).eq("id", characterId),
  ])
}

export async function resolveAndRemove(reportId: string, characterId: string) {
  await assertAdmin()
  await Promise.all([
    supabaseAdmin.from("reports").update({ resolved: true }).eq("id", reportId),
    supabaseAdmin.from("characters").delete().eq("id", characterId),
  ])
}

export async function adminCreateUser(formData: FormData) {
  await assertAdmin()
  
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const username = formData.get("username") as string
  const display_name = formData.get("display_name") as string

  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (data.user && (username || display_name)) {
    const updates: any = {}
    if (username) updates.username = username
    if (display_name) updates.display_name = display_name
    
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", data.user.id)
    
    if (profileError) {
      console.error("Error updating profile:", profileError)
    }
  }

  return { success: true }
}