import type { IController } from '@infra/http/interfaces/icontroller.ts'
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@shared/field-limits.ts'
import type { SignUpUseCase } from '@use-cases/sign-up.usecase.ts'
import type { Request, Response } from 'express'
import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(2).max(NAME_MAX_LENGTH),
  email: z.email().min(1).max(EMAIL_MAX_LENGTH),
  password: z.string().min(8).max(PASSWORD_MAX_LENGTH),
})

export class SignUpController implements IController {
  constructor(private readonly signUpUseCase: SignUpUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { email, name, password } = signUpSchema.parse(req.body)

    await this.signUpUseCase.execute({ email, name, password })

    res.sendStatus(204)
  }
}
