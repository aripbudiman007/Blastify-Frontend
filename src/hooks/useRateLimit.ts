import { useState, useEffect } from 'react'

interface RateLimitState {
  isLimited: boolean
  secondsRemaining: number
  minutesRemaining: number
  percentRemaining: number
}

export function useRateLimit(
  endpoint: string,
  defaultRetrySeconds: number = 900
): RateLimitState {
  const [isLimited, setIsLimited] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  // Check localStorage on mount
  useEffect(() => {
    const rateLimitKey = `rateLimit:${endpoint}`
    const limitedAt = localStorage.getItem(`${rateLimitKey}:at`)
    const retrySeconds = parseInt(
      localStorage.getItem(`${rateLimitKey}:retrySeconds`) || '0'
    )

    if (limitedAt && retrySeconds > 0) {
      const elapsedSeconds = Math.floor((Date.now() - parseInt(limitedAt)) / 1000)
      const remaining = Math.max(0, retrySeconds - elapsedSeconds)

      if (remaining > 0) {
        setIsLimited(true)
        setSecondsRemaining(remaining)
      } else {
        // Rate limit window has passed, clear it
        localStorage.removeItem(`${rateLimitKey}:at`)
        localStorage.removeItem(`${rateLimitKey}:retrySeconds`)
        setIsLimited(false)
      }
    }
  }, [endpoint])

  // Update countdown every second
  useEffect(() => {
    if (!isLimited || secondsRemaining <= 0) return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLimited(false)
          // Clear from localStorage when window expires
          localStorage.removeItem(`rateLimit:${endpoint}:at`)
          localStorage.removeItem(`rateLimit:${endpoint}:retrySeconds`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLimited, secondsRemaining, endpoint])

  return {
    isLimited,
    secondsRemaining,
    minutesRemaining: Math.ceil(secondsRemaining / 60),
    percentRemaining: (secondsRemaining / (defaultRetrySeconds || 1)) * 100,
  }
}
