import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'

const permissions = [
  { name: 'Read leads', code: 'leads:read' },
  { name: 'Write leads', code: 'leads:write' },
]

for (const permission of permissions) {
  await prisma.permission.upsert({
    where: { code: permission.code },
    update: {},
    create: permission,
  })
}

const rolePermissions: Record<string, string[]> = {
  USER: ['leads:read'],
  ADMIN: ['leads:read', 'leads:write'],
}

for (const [name, permissionCodes] of Object.entries(rolePermissions)) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  })

  for (const permissionCode of permissionCodes) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionCode: { roleId: role.id, permissionCode },
      },
      update: {},
      create: { roleId: role.id, permissionCode },
    })
  }
}

await prisma.lead.deleteMany()

const leads = Array.from({ length: 20 }, () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
}))

await prisma.lead.createMany({ data: leads })

await prisma.$disconnect()

console.log(
  `Seeded ${Object.keys(rolePermissions).length} roles, ${permissions.length} permissions and ${leads.length} leads.`,
)
