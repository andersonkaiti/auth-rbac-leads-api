import type { IMiddleware } from '@infra/http/interfaces/imiddleware.ts'
import { env } from '@shared/env.ts'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

export class AuthenticationMiddleware implements IMiddleware {
  private jwtPayloadSchema = z.object({
    sub: z.string(),
    role: z.uuid(),
  })

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { authorization } = req.headers

    if (!authorization) {
      res.status(401).json({ error: 'Invalid access token' })
      return
    }

    try {
      const [prefix, accessToken] = authorization.split(' ')

      if (prefix !== 'Bearer') {
        res.status(401).json({ error: 'Invalid access token' })
        return
      }

      const rawPayload = jwt.verify(accessToken, env.JWT_SECRET)
      const payload = this.jwtPayloadSchema.parse(rawPayload)

      req.metadata = {
        ...req.metadata,
        account: {
          accountId: payload.sub,
          role: payload.role,
        },
      }

      next()
    } catch {
      res.status(401).json({ error: 'Invalid access token' })
    }
  }
}
