import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { bearer } from '@tests/security/helpers/bearer.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import { getRoleId } from '@tests/security/helpers/get-role-id.ts'
import { newLead } from '@tests/security/helpers/new-lead.ts'
import { signIn } from '@tests/security/helpers/sign-in.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let user: ITestAccount

beforeAll(async () => {
  user = await createUserAccount()
})

afterAll(cleanDatabase)

describe('RBAC: USER (leads:read)', () => {
  it('should return 403 when creating a lead', async () => {
    const { accessToken } = await signIn(user)

    const response = await request(app)
      .post('/leads')
      .set('Authorization', bearer(accessToken))
      .send(newLead())

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({ error: 'Access denied' })
  })
})

describe('RBAC: privilege escalation on sign-up', () => {
  it('should ignore roleId and role sent to /sign-up', async () => {
    const adminRole = await getRoleId('ADMIN')
    const userRole = await getRoleId('USER')
    const email = faker.internet.email().toLowerCase()
    const password = faker.internet.password({ length: 12 })

    const signUp = await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email,
      password,
      roleId: adminRole,
      role: 'ADMIN',
    })
    const account = await prisma.account.findFirstOrThrow({ where: { email } })

    expect(signUp.statusCode).toBe(204)
    expect(account.roleId).toBe(userRole)
  })
})
