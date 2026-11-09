import type { IRole } from '@entities/role.entity.ts'

export interface IRolesRepository {
  findRoleByName(name: string): Promise<IRole | null>
}
