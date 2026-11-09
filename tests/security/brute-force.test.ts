import { app } from '@infra/http/app.ts'
import { SIGN_IN_MAX_FAILED_ATTEMPTS } from '@middlewares/sign-in-rate-limit.middleware.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

afterAll(cleanDatabase)

const signInWith = (email: string, password: string) =>
  request(app).post('/sign-in').send({ email, password })

async function failSignIn(email: string, times = SIGN_IN_MAX_FAILED_ATTEMPTS) {
  for (let attempt = 0; attempt < times; attempt++) {
    const response = await signInWith(email, `wrong-password-${attempt}`)

    expect(response.statusCode).toBe(401)
  }
}

describe('Brute force: /sign-in lockout after repeated failures', () => {
  it('should return 429 after 5 wrong attempts', async () => {
    const user = await createUserAccount()
    await failSignIn(user.email)

    const response = await signInWith(user.email, 'another-wrong-one')

    expect(response.statusCode).toBe(429)
    expect(response.body).toEqual({
      error: 'Too many attempts, try again later',
    })
    expect(response.headers).toHaveProperty('ratelimit')
  })

  it('should block even the correct password during the lockout', async () => {
    const user = await createUserAccount()
    await failSignIn(user.email)

    const response = await signInWith(user.email, user.password)

    expect(response.statusCode).toBe(429)
    expect(response.body).not.toHaveProperty('accessToken')
  })
})
