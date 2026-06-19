export type Category =
  | "strength"
  | "speed"
  | "intelligence"
  | "durability"
  | "power"
  | "combat"
  | "overall"

export type ReportReason =
  | "duplicate_entry"
  | "joke_character"
  | "wrong_version"
  | "character_does_not_exist"
  | "copyright_image"
  | "inappropriate_image"

export type KnownSource = "swipe_onboarding" | "manual_search" | "organic_behavior"

export interface Character {
  id: string
  name: string
  series: string
  version: string | null
  image_url: string
  image_public_id: string | null
  description: string
  elo: number
  categories: Category[]
  submitted_by: string | null
  approved: boolean
  inappropriate_flagged: boolean
  is_deleted: boolean
  created_at: string
}

export interface UserKnownCharacter {
  user_id: string
  character_id: string
  source: KnownSource
}

export interface Vote {
  id: string
  voter_id: string
  winner_id: string
  loser_id: string | null
  skipped: boolean
  created_at: string
}

export interface MatchExposure {
  id: string
  user_id: string
  character_a_id: string
  character_b_id: string
  shown_at: string
}

export interface Report {
  id: string
  reporter_id: string
  character_id: string
  reason: ReportReason
  created_at: string
  resolved: boolean
}

export interface Matchup {
  characterA: Character
  characterB: Character
}

export interface LeaderboardEntry extends Character {
  rank: number
  win_count: number
  loss_count: number
  win_rate: number
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  vote_limit: number
  upload_limit: number
  last_reset_date: string
  created_at: string
  last_seen_at: string | null
}
