import { prisma } from '@database/prisma/index.ts'

export async function getRoleId(name: 'USER' | 'ADMIN'): Promise<string> {
  const role = await prisma.role.findFirst({ where: { name } })

  if (!role) {
    throw new Error(`${name} role not found`)
  }

  return role.id
}
