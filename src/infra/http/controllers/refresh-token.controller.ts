import type { IController } from '@infra/http/interfaces/icontroller.ts'
import type { RefreshTokenUseCase } from '@use-cases/refresh-token.usecase.ts'
import type { Request, Response } from 'express'
import { z } from 'zod'

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export class RefreshTokenController implements IController {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { refreshToken: incomingRefreshToken } = refreshTokenSchema.parse(
      req.body,
    )

    const { accessToken, refreshToken } =
      await this.refreshTokenUseCase.execute({
        incomingRefreshToken,
      })

    res.status(200).json({
      accessToken,
      refreshToken,
    })
  }
}
