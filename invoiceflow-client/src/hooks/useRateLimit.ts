import { useState, useEffect } from 'react'

const MAX_ATTEMPTS = 5
const WINDOW_HOURS = 24

export const useRateLimit = (action: string) => {
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
  const [resetTime, setResetTime] = useState<Date | null>(null)

  useEffect(() => {
    // Load from localStorage
    const key = `rate_limit_${action}`
    const stored = localStorage.getItem(key)
    
    if (stored) {
      const { attempts, resetAt } = JSON.parse(stored)
      const reset = new Date(resetAt)
      
      if (new Date() > reset) {
        // Reset period has passed
        localStorage.removeItem(key)
        setAttemptsLeft(MAX_ATTEMPTS)
        setResetTime(null)
      } else {
        setAttemptsLeft(attempts)
        setResetTime(reset)
      }
    }
  }, [action])

  const recordAttempt = () => {
    const newAttempts = attemptsLeft - 1
    setAttemptsLeft(newAttempts)

    const reset = resetTime || new Date(Date.now() + WINDOW_HOURS * 60 * 60 * 1000)
    setResetTime(reset)

    localStorage.setItem(`rate_limit_${action}`, JSON.stringify({
      attempts: newAttempts,
      resetAt: reset.toISOString()
    }))
  }

  const canAttempt = attemptsLeft > 0

  return {
    attemptsLeft,
    canAttempt,
    resetTime,
    recordAttempt
  }
}
