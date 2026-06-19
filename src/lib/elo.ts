const K = 32

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function calculateElo(
  winnerRating: number,
  loserRating: number
): { newWinnerRating: number; newLoserRating: number } {
  const expectedWinner = expectedScore(winnerRating, loserRating)
  const expectedLoser = expectedScore(loserRating, winnerRating)

  return {
    newWinnerRating: Math.round(winnerRating + K * (1 - expectedWinner)),
    newLoserRating: Math.round(loserRating + K * (0 - expectedLoser)),
  }
}

export function formatElo(elo: number): string {
  return elo.toLocaleString()
}

export function eloTier(elo: number): string {
  if (elo >= 2400) return "Godlike"
  if (elo >= 2000) return "Legendary"
  if (elo >= 1800) return "Elite"
  if (elo >= 1600) return "Strong"
  if (elo >= 1400) return "Average"
  if (elo >= 1200) return "Weak"
  return "Fodder"
}
