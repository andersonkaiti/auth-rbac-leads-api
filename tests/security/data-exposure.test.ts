import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { BCRYPT_REGEX } from '@tests/security/helpers/bcrypt-regex.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let user: ITestAccount
let storedHash: string

beforeAll(async () => {
  user = await createUserAccount()

  const account = await prisma.account.findFirstOrThrow({
    where: { id: user.id },
  })
  storedHash = account.password
})

afterAll(cleanDatabase)

// Fails if the response (body or headers) contains a bcrypt hash, the hash
// stored in the database or the plain-text password that was sent.
function expectNoSecrets(response: request.Response, plainPassword?: string) {
  const raw = `${response.text}${JSON.stringify(response.headers)}`

  expect(raw).not.toMatch(BCRYPT_REGEX)
  expect(raw).not.toContain(storedHash)

  if (plainPassword) {
    expect(raw).not.toContain(plainPassword)
  }
}

describe('Data exposure: /sign-up', () => {
  it('should not return password or hash on the 409 error', async () => {
    const response = await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email: user.email,
      password: user.password,
    })

    expect(response.statusCode).toBe(409)
    expectNoSecrets(response, user.password)
  })
})
