"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const THEMES = [
  { id: "default", label: "Manga", color: "bg-neutral-100 ring-1 ring-neutral-500" },
  { id: "red-blue", label: "Hero", color: "bg-red-500" },
  { id: "purple-green", label: "Villain", color: "bg-purple-600" },
]

export function ThemeSelector() {
  const [theme, setTheme] = React.useState("default")

  React.useEffect(() => {
    const saved = localStorage.getItem("battlerank-theme") || "default"
    setTheme(saved)
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem("battlerank-theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Palette className="h-4 w-4" />
            <span className="sr-only">Switch theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem 
            key={t.id} 
            onClick={() => changeTheme(t.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={`h-3 w-3 rounded-full ${t.color}`} />
            <span className={theme === t.id ? "font-bold" : ""}>{t.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
