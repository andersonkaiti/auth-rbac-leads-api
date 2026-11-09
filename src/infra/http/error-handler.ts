import { ConflictError } from '@errors/conflict.error.ts'
import { Unauthorized } from '@errors/unauthorized.error.ts'
import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  console.error(error)

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: error.issues,
    })
  }

  if (error instanceof ConflictError) {
    return res.status(409).json({
      error: error.message,
    })
  }

  if (error instanceof Unauthorized) {
    return res.status(401).json({
      error: error.message,
    })
  }

  const { type } = error as Error & { type?: string }

  if (type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Malformed JSON body',
    })
  }

  if (type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
    })
  }

  return res.status(500).json({
    error: 'Internal server error',
  })
}
