import type { IMiddleware } from '@infra/http/interfaces/imiddleware.ts'
import type { GetRolePermissionsUseCase } from '@use-cases/get-role-permissions.usecase.ts'
import type { NextFunction, Request, Response } from 'express'

export class AuthorizationMiddleware implements IMiddleware {
  constructor(
    private readonly requiredPermissions: string[],
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
  ) {}

  async handle(
    { metadata }: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!metadata?.account) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    const { permissionCodes } = await this.getRolePermissionsUseCase.execute({
      roleId: metadata.account.role,
    })

    const isAllowed = this.requiredPermissions.some((code) =>
      permissionCodes.includes(code),
    )

    if (!isAllowed) {
      res.status(403).json({ error: 'Access denied' })
      return
    }

    next()
  }
}
