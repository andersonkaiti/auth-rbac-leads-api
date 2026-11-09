import { execSync } from 'node:child_process'
import { config } from 'dotenv'

const roleDefinitions = [
  {
    name: 'USER',
    permissions: [
      {
        name: 'Read Leads',
        code: 'leads:read',
      },
    ],
  },
  {
    name: 'ADMIN',
    permissions: [
      {
        name: 'Write Leads',
        code: 'leads:write',
      },
    ],
  },
]

export async function setup() {
  config({ path: '.env' })

  process.env.DATABASE_URL = process.env.DATABASE_URL?.replace(
    'schema=public',
    'schema=test',
  )

  execSync('pnpm prisma migrate deploy')

  const { prisma } = await import('@database/prisma/index.ts')

  for (const { name, permissions } of roleDefinitions) {
    const existing = await prisma.role.findFirst({ where: { name } })
    const role = existing ?? (await prisma.role.create({ data: { name } }))

    for (const { name: permName, code } of permissions) {
      await prisma.permission.upsert({
        where: {
          code,
        },
        update: {},
        create: {
          name: permName,
          code,
        },
      })

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionCode: {
            roleId: role.id,
            permissionCode: code,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionCode: code,
        },
      })
    }
  }
}
