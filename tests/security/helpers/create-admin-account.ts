import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { getRoleId } from '@tests/security/helpers/get-role-id.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import { hash } from 'bcryptjs'

export async function createAdminAccount(): Promise<ITestAccount> {
  const email = faker.internet.email().toLowerCase()
  const password = faker.internet.password({ length: 12 })
  const roleId = await getRoleId('ADMIN')

  const account = await prisma.account.create({
    data: {
      name: faker.person.fullName(),
      email,
      password: await hash(password, 8),
      roleId,
    },
  })

  return { id: account.id, email, password, roleId }
}
