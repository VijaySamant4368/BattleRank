"use client"

import { motion } from "framer-motion"
import type { Character } from "@/types"
import { Flag } from "lucide-react"
import { eloTier } from "@/lib/elo"

interface MatchupCardProps {
  character: Character
  onClick: () => void
  disabled?: boolean
  result?: "winner" | "loser" | null
}

export function MatchupCard({ character, onClick, disabled, result }: MatchupCardProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      className={`relative w-full flex-1 rounded-xl border overflow-hidden text-left transition-colors ${
        result === "winner"
          ? "border-green-500/50 bg-green-500/5"
          : result === "loser"
          ? "border-border/50 opacity-40"
          : "border-border hover:border-foreground/20 bg-card"
      } ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      {/* Image */}
      <div className="aspect-[3/4] relative bg-secondary">
        {character.inappropriate_flagged && (
          <div className="absolute inset-0 bg-card/90 backdrop-blur-md flex items-center justify-center z-10">
            <span className="text-xs text-muted-foreground">Image under review</span>
          </div>
        )}
        {character.image_url && !character.inappropriate_flagged && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            referrerPolicy="no-referrer"
            src={character.image_url}
            alt={character.name}
            className="h-full w-full object-cover object-top"
          />
        )}

        {result === "winner" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-white font-bold text-lg">Winner</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-base leading-tight">{character.name}</h3>
        <div className="text-xs text-muted-foreground mt-0.5">{character.series}</div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{eloTier(character.elo)}</span>
          <span className="text-sm font-mono text-accent elo-number">
            {character.elo.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

interface ReportButtonProps {
  characterId: string
  onReport: (characterId: string) => void
}

export function ReportButton({ characterId, onReport }: ReportButtonProps) {
  return (
    <button
      onClick={() => onReport(characterId)}
      className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
      title="Report character"
    >
      <Flag className="h-3.5 w-3.5" />
    </button>
  )
}
