import type { IController } from '@infra/http/interfaces/icontroller.ts'
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '@shared/field-limits.ts'
import type { SignInUseCase } from '@use-cases/sign-in.usecase.ts'
import type { Request, Response } from 'express'
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email().min(1).max(EMAIL_MAX_LENGTH),
  password: z.string().min(8).max(PASSWORD_MAX_LENGTH),
})

export class SignInController implements IController {
  constructor(private readonly signInUseCase: SignInUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { email, password } = signInSchema.parse(req.body)

    const { accessToken, refreshToken } = await this.signInUseCase.execute({
      email,
      password,
    })

    res.status(200).json({
      accessToken,
      refreshToken,
    })
  }
}
