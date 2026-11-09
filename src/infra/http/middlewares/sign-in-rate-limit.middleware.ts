import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

export const SIGN_IN_MAX_FAILED_ATTEMPTS = 5
export const SIGN_IN_WINDOW_IN_MINUTES = 15

export const signInRateLimit = rateLimit({
  windowMs: SIGN_IN_WINDOW_IN_MINUTES * 60 * 1000,
  limit: SIGN_IN_MAX_FAILED_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''

    return `${ipKeyGenerator(req.ip ?? '')}:${email}`
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many attempts, try again later' })
  },
})
