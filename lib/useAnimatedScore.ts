'use client'

import { useEffect, useState } from 'react'

export function useAnimatedScore(target: number, duration = 1400): number {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (target <= 0) {
      setDisplay(0)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return display
}
