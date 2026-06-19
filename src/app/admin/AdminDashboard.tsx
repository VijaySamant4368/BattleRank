"use client"

import { useState, useTransition } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { AdminAddUserForm } from "./AdminAddUserForm"
import {
  approveCharacter,
  rejectCharacter,
  resolveReport,
  resolveAndApprove,
  resolveAndRemove,
} from "./actions"
import type { Character, Report, ReportReason } from "@/types"

interface ReportWithCharacter extends Report {
  characters: Pick<Character, "id" | "name" | "series" | "version" | "image_url" | "approved"> | null
}

interface Props {
  pendingCharacters: Character[]
  reports: ReportWithCharacter[]
}

const REASON_LABELS: Record<ReportReason, string> = {
  duplicate_entry: "Duplicate entry",
  joke_character: "Joke character",
  wrong_version: "Wrong version",
  character_does_not_exist: "Does not exist",
  copyright_image: "Copyrighted image",
  inappropriate_image: "Inappropriate image",
}

function PendingCard({ char, onAction }: { char: Character; onAction: (id: string) => void }) {
  const [pending, startTransition] = useTransition()

  const handle = (action: "approve" | "reject") => {
    startTransition(async () => {
      if (action === "approve") {
        await approveCharacter(char.id)
        toast.success(`${char.name} approved`)
      } else {
        await rejectCharacter(char.id)
        toast.success(`${char.name} rejected and deleted`)
      }
      onAction(char.id)
    })
  }

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="w-20 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img referrerPolicy="no-referrer" src={char.image_url} alt={char.name} className="w-full h-full object-cover object-top" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{char.name}</p>
            <p className="text-xs text-muted-foreground">
              {char.series}{char.version ? ` · ${char.version}` : ""}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(char.created_at).toLocaleDateString()}
          </span>
        </div>
        {char.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{char.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {char.categories.map((c) => (
            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handle("approve")}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            Reject & Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ report, onAction }: { report: ReportWithCharacter; onAction: (id: string) => void }) {
  const [pending, startTransition] = useTransition()
  const char = report.characters

  const handle = (action: "resolve" | "approve" | "remove") => {
    startTransition(async () => {
      if (action === "resolve") {
        await resolveReport(report.id)
        toast.success("Report resolved")
      } else if (action === "approve") {
        await resolveAndApprove(report.id, report.character_id)
        toast.success("Resolved and character approved")
      } else {
        await resolveAndRemove(report.id, report.character_id)
        toast.success("Resolved and character removed")
      }
      onAction(report.id)
    })
  }

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-card">
      {char && (
        <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img referrerPolicy="no-referrer"src={char.image_url} alt={char.name} className="w-full h-full object-cover object-top" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{char?.name ?? "Unknown"}</p>
            <p className="text-xs text-muted-foreground">
              {char?.series}{char?.version ? ` · ${char.version}` : ""}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-1.5">
          <Badge variant="destructive" className="text-xs">{REASON_LABELS[report.reason]}</Badge>
        </div>
        {char && !char.approved && (
          <p className="text-xs text-amber-500 mt-1">Character is pending approval</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => handle("resolve")}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
          {char && !char.approved && (
            <button
              onClick={() => handle("approve")}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              Approve Character
            </button>
          )}
          <button
            onClick={() => handle("remove")}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
          >
            Remove Character
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard({ pendingCharacters, reports }: Props) {
  const [pending, setPending] = useState(pendingCharacters)
  const [reportList, setReportList] = useState(reports)

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="pending">
          Pending{pending.length > 0 ? ` (${pending.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="reports">
          Reports{reportList.length > 0 ? ` (${reportList.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="users">
          Manage Users
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No pending characters</p>
        ) : (
          <div className="space-y-3">
            {pending.map((char) => (
              <PendingCard
                key={char.id}
                char={char}
                onAction={(id) => setPending((prev) => prev.filter((c) => c.id !== id))}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reports">
        {reportList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No open reports</p>
        ) : (
          <div className="space-y-3">
            {reportList.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onAction={(id) => setReportList((prev) => prev.filter((r) => r.id !== id))}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="users">
        <div className="py-2">
          <AdminAddUserForm />
        </div>
      </TabsContent>
    </Tabs>
  )
}
