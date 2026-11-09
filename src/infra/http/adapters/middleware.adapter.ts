import type { IMiddleware } from '@infra/http/interfaces/imiddleware.ts'
import type { NextFunction, Request, Response } from 'express'

export function middlewareAdapter(middleware: IMiddleware) {
  return async (req: Request, res: Response, next: NextFunction) =>
    await middleware.handle(req, res, next)
}
