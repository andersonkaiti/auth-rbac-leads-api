import type { IController } from '@infra/http/interfaces/icontroller.ts'
import type { Request, Response } from 'express'

export function routeAdapter(controller: IController) {
  return async (req: Request, res: Response) =>
    await controller.handle(req, res)
}
