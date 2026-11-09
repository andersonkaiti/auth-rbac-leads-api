import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { bearer } from '@tests/security/helpers/bearer.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createAdminAccount } from '@tests/security/helpers/create-admin-account.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import { signIn } from '@tests/security/helpers/sign-in.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const SQL_PAYLOAD = "' OR '1'='1' --"

let user: ITestAccount

beforeAll(async () => {
  user = await createUserAccount()
})

afterAll(cleanDatabase)

describe('SQL Injection: /sign-in', () => {
  it('should reject the classic payload in the password field', async () => {
    const response = await request(app)
      .post('/sign-in')
      .send({ email: user.email, password: SQL_PAYLOAD })

    expect(response.statusCode).toBe(401)
    expect(response.body).not.toHaveProperty('accessToken')
  })
})

describe('SQL Injection: data stored as literal text', () => {
  it('should store the payload in a lead name as text', async () => {
    const admin = await createAdminAccount()
    const { accessToken: adminToken } = await signIn(admin)
    const { accessToken: userToken } = await signIn(user)
    const lead = {
      name: "x'); DROP TABLE leads;--",
      email: faker.internet.email().toLowerCase(),
    }

    const created = await request(app)
      .post('/leads')
      .set('Authorization', bearer(adminToken))
      .send(lead)
    const list = await request(app)
      .get('/leads')
      .set('Authorization', bearer(userToken))

    expect(created.statusCode).toBe(201)
    expect(list.body.leads).toEqual(
      expect.arrayContaining([expect.objectContaining(lead)]),
    )
  })
})
