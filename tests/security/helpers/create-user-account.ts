import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'

export async function createUserAccount(): Promise<ITestAccount> {
  const email = faker.internet.email().toLowerCase()
  const password = faker.internet.password({ length: 12 })

  await request(app)
    .post('/sign-up')
    .send({ name: faker.person.fullName(), email, password })

  const account = await prisma.account.findFirstOrThrow({ where: { email } })

  return { id: account.id, email, password, roleId: account.roleId }
}
