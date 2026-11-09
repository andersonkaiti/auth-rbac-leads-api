import type { IController } from '@infra/http/interfaces/icontroller.ts'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from '@shared/field-limits.ts'
import type { CreateLeadUseCase } from '@use-cases/create-lead.usecase.ts'
import type { Request, Response } from 'express'
import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().max(NAME_MAX_LENGTH),
  email: z.email().max(EMAIL_MAX_LENGTH),
})

export class CreateLeadController implements IController {
  constructor(private readonly createLeadUseCase: CreateLeadUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    const { name, email } = createLeadSchema.parse(req.body)

    await this.createLeadUseCase.execute({ name, email })

    res.sendStatus(201)
  }
}
