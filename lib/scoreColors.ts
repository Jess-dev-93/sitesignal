export type ScoreTone = 'strong' | 'warning' | 'poor'

export function normalizeScore(score: unknown): number {
  return typeof score === 'number' && !Number.isNaN(score) ? score : 0
}

export function getScoreTone(score: unknown): ScoreTone {
  const safeScore = normalizeScore(score)

  if (safeScore >= 70) return 'strong'
  if (safeScore >= 50) return 'warning'
  return 'poor'
}

export function getScoreStyles(score: unknown) {
  const safeScore = normalizeScore(score)
  const tone = getScoreTone(safeScore)

  if (tone === 'strong') {
    return {
      score: safeScore,
      tone,
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      text: 'text-emerald-300',
      bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      ring: 'border-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
      panel: 'border-emerald-500/20 bg-emerald-500/[0.06]',
      hex: '#34d399',
      label: 'Strong',
      icon: '✅',
    }
  }

  if (tone === 'warning') {
    return {
      score: safeScore,
      tone,
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      text: 'text-amber-300',
      bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      ring: 'border-amber-500/30',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
      panel: 'border-amber-500/20 bg-amber-500/[0.06]',
      hex: '#fbbf24',
      label: 'Needs work',
      icon: '⚠️',
    }
  }

  return {
    score: safeScore,
    tone,
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    text: 'text-rose-300',
    bar: 'bg-gradient-to-r from-rose-500 to-rose-400',
    ring: 'border-rose-500/30',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]',
    panel: 'border-rose-500/20 bg-rose-500/[0.06]',
    hex: '#fb7185',
    label: 'Poor',
    icon: '❌',
  }
}