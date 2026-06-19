"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Category } from "@/types"

export async function updateCharacter(id: string, data: { description: string; categories: Category[] }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("characters")
    .update(data)
    .eq("id", id)
    .eq("submitted_by", user.id)

  if (error) throw error
  revalidatePath("/profile/submissions")
}

export async function deleteCharacter(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from("characters")
    .update({ is_deleted: true })
    .eq("id", id)
    .eq("submitted_by", user.id)

  if (error) throw error
  revalidatePath("/profile/submissions")
}
