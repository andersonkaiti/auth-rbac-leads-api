import { env } from '@shared/env.ts'
import jwt from 'jsonwebtoken'

export function signToken(
  payload: Record<string, unknown>,
  options: jwt.SignOptions = { expiresIn: '1m' },
): string {
  return jwt.sign(payload, env.JWT_SECRET, options)
}
