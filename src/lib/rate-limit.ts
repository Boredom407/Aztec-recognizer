/**
 * Simple in-memory rate limiter using sliding window algorithm
 * For production, consider Redis-based solution for multi-instance deployments
 */

type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

type RequestRecord = {
  timestamps: number[]
}

class RateLimiter {
  private store = new Map<string, RequestRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour

    for (const [key, record] of this.store.entries()) {
      const oldestTimestamp = record.timestamps[0]
      if (oldestTimestamp && now - oldestTimestamp > maxAge) {
        this.store.delete(key)
      }
    }
  }

  check(identifier: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const windowStart = now - config.windowMs

    let record = this.store.get(identifier)

    if (!record) {
      record = { timestamps: [] }
      this.store.set(identifier, record)
    }

    // Remove timestamps outside the current window
    record.timestamps = record.timestamps.filter(ts => ts > windowStart)

    const allowed = record.timestamps.length < config.maxRequests

    if (allowed) {
      record.timestamps.push(now)
    }

    const remaining = Math.max(0, config.maxRequests - record.timestamps.length)
    const resetAt = record.timestamps[0] ? record.timestamps[0] + config.windowMs : now + config.windowMs

    return { allowed, remaining, resetAt }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter()

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // 10 nominations per hour per user
  nominations: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  // 50 votes per hour per user (allow voting on multiple nominations)
  votes: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000,
  },
  // 100 reads per minute per user (more generous for viewing)
  reads: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
} as const

export class RateLimitError extends Error {
  status: number
  resetAt: number

  constructor(message: string, resetAt: number) {
    super(message)
    this.status = 429
    this.resetAt = resetAt
    this.name = "RateLimitError"
  }
}

/**
 * Check rate limit for a user on a specific endpoint
 * @throws {RateLimitError} if rate limit exceeded
 */
export function checkRateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS,
): void {
  const config = RATE_LIMITS[endpoint]
  const identifier = `${endpoint}:${userId}`
  const result = rateLimiter.check(identifier, config)

  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetAt - Date.now()) / 1000)
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
      result.resetAt,
    )
  }
}

/**
 * Get current rate limit status without incrementing counter
 */
export function getRateLimitStatus(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS,
): { remaining: number; resetAt: number } {
  const config = RATE_LIMITS[endpoint]
  const identifier = `${endpoint}:${userId}`

  // Create a temporary check without modifying the store
  const now = Date.now()
  const windowStart = now - config.windowMs
  const record = rateLimiter['store'].get(identifier)

  if (!record) {
    return { remaining: config.maxRequests, resetAt: now + config.windowMs }
  }

  const validTimestamps = record.timestamps.filter(ts => ts > windowStart)
  const remaining = Math.max(0, config.maxRequests - validTimestamps.length)
  const resetAt = validTimestamps[0] ? validTimestamps[0] + config.windowMs : now + config.windowMs

  return { remaining, resetAt }
}

// Export for testing purposes
export { rateLimiter }
