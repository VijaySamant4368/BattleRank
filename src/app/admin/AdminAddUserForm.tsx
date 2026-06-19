"use client"

import { useState } from "react"
import { adminCreateUser } from "./actions"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export function AdminAddUserForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    try {
      await adminCreateUser(formData)
      toast.success("User account successfully created!")
      ;(e.target as HTMLFormElement).reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-border rounded-xl p-5 bg-card">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Create System User</h2>
        <p className="text-xs text-muted-foreground">
          Provision a new account instantly. Email verification will be automatically bypassed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 w-full">
            <Label htmlFor="admin-email" className="text-xs font-medium">
              User Email
            </Label>
            <Input 
              id="admin-email"
              name="email" 
              type="email" 
              placeholder="tester@example.com" 
              required 
              className="h-9 text-sm"
            />
          </div>
          
          <div className="space-y-1.5 w-full">
            <Label htmlFor="admin-pass" className="text-xs font-medium">
              Password
            </Label>
            <Input 
              id="admin-pass"
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              minLength={8}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5 w-full">
            <Label htmlFor="admin-username" className="text-xs font-medium">
              Username (Optional)
            </Label>
            <Input 
              id="admin-username"
              name="username" 
              placeholder="batman_99" 
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5 w-full">
            <Label htmlFor="admin-display-name" className="text-xs font-medium">
              Display Name (Optional)
            </Label>
            <Input 
              id="admin-display-name"
              name="display_name" 
              placeholder="Bruce Wayne" 
              className="h-9 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto self-end px-8 h-9 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Create User"}
        </button>
      </form>
    </div>
  )
}