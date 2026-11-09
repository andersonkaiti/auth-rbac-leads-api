import type { IPermission } from '@entities/permission.entity.ts'

export interface IPermissionsRepository {
  findPermissionsByRoleId(
    roleId: string,
  ): Promise<Pick<IPermission, 'permissionCode'>[]>
}
