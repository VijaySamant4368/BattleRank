"use client"

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import type { Character } from "@/types"
import { X, Check } from "lucide-react"

interface SwipeCardProps {
  character: Character
  onSwipe: (known: boolean) => void
  index: number
}

export function SwipeCard({ character, onSwipe, index }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const knowOpacity = useTransform(x, [20, 80], [0, 1])
  const skipOpacity = useTransform(x, [-80, -20], [1, 0])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe(true)
    } else if (info.offset.x < -100) {
      onSwipe(false)
    }
  }

  return (
    <motion.div
      style={{ x, rotate, zIndex: 10 - index }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      className="absolute inset-0 cursor-grab select-none"
      animate={index === 0 ? {} : { scale: 1 - index * 0.04, y: index * 10 }}
    >
      {/* Know indicator */}
      <motion.div
        style={{ opacity: knowOpacity }}
        className="absolute top-6 left-6 z-10 border-2 border-green-500 text-green-500 rounded-md px-3 py-1 font-bold text-sm uppercase tracking-widest rotate-[-12deg]"
      >
        Know
      </motion.div>

      {/* Skip indicator */}
      <motion.div
        style={{ opacity: skipOpacity }}
        className="absolute top-6 right-6 z-10 border-2 border-red-500 text-red-500 rounded-md px-3 py-1 font-bold text-sm uppercase tracking-widest rotate-[12deg]"
      >
        Skip
      </motion.div>

      <div className="h-full w-full rounded-2xl border border-border bg-card overflow-hidden">
        {/* Image */}
        <div className="h-[60%] relative bg-secondary">
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
              draggable={false}
            />
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <h2 className="font-bold text-xl leading-tight">{character.name}</h2>
          {character.version && (<h3 className="font-bold text-l leading-tight">{character.version}</h3>)}
          <div className="text-sm text-muted-foreground mt-1">
            {character.series}
          </div>
          {character.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
              {character.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface SwipeButtonsProps {
  onKnow: () => void
  onSkip: () => void
}

export function SwipeButtons({ onKnow, onSkip }: SwipeButtonsProps) {
  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={onSkip}
        className="flex items-center justify-center w-14 h-14 rounded-full border border-border hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
      >
        <X className="h-5 w-5 text-muted-foreground" />
      </button>
      <button
        onClick={onKnow}
        className="flex items-center justify-center w-14 h-14 rounded-full border border-border hover:border-green-500/50 hover:bg-green-500/10 transition-colors"
      >
        <Check className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  )
}
