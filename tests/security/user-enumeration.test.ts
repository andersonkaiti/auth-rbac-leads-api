import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let user: ITestAccount

beforeAll(async () => {
  user = await createUserAccount()
})

afterAll(cleanDatabase)

const signInAsUnknownEmail = () =>
  request(app)
    .post('/sign-in')
    .send({
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 12 }),
    })

const signInWithWrongPassword = () =>
  request(app)
    .post('/sign-in')
    .send({ email: user.email, password: `${user.password}-wrong` })

describe('User enumeration: /sign-in', () => {
  it('should return the same status and body in both scenarios', async () => {
    const unknownEmail = await signInAsUnknownEmail()
    const wrongPassword = await signInWithWrongPassword()

    expect(unknownEmail.statusCode).toBe(401)
    expect(wrongPassword.statusCode).toBe(unknownEmail.statusCode)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.text).toBe(unknownEmail.text)
  })
})
