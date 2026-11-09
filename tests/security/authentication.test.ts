import { app } from '@infra/http/app.ts'
import { base64Url } from '@tests/security/helpers/base64-url.ts'
import { bearer } from '@tests/security/helpers/bearer.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createUserAccount } from '@tests/security/helpers/create-user-account.ts'
import { decodePayload } from '@tests/security/helpers/decode-payload.ts'
import { getRoleId } from '@tests/security/helpers/get-role-id.ts'
import { newLead } from '@tests/security/helpers/new-lead.ts'
import { signIn } from '@tests/security/helpers/sign-in.ts'
import { signToken } from '@tests/security/helpers/sign-token.ts'
import type { ITestAccount } from '@tests/security/helpers/test-account.type.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const INVALID_TOKEN = { error: 'Invalid access token' }

let user: ITestAccount

beforeAll(async () => {
  user = await createUserAccount()
})

afterAll(cleanDatabase)

describe('JWT: request without token', () => {
  it('should return 401 on GET /leads without Authorization', async () => {
    const response = await request(app).get('/leads')

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual(INVALID_TOKEN)
  })
})

describe('JWT: tampered token (original signature kept)', () => {
  it('should return 401 when the role is swapped for ADMIN', async () => {
    const { accessToken } = await signIn(user)
    const [header, , signature] = accessToken.split('.')
    const adminRole = await getRoleId('ADMIN')

    const payload = { ...decodePayload(accessToken), role: adminRole }
    const forged = `${header}.${base64Url(payload)}.${signature}`

    const response = await request(app)
      .post('/leads')
      .set('Authorization', bearer(forged))
      .send(newLead())

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual(INVALID_TOKEN)
  })
})

describe('JWT: unsigned token (alg: none)', () => {
  const unsignedToken = (alg: string) => {
    const header = base64Url({ alg, typ: 'JWT' })
    const payload = base64Url({
      sub: user.id,
      role: user.roleId,
      exp: Math.floor(Date.now() / 1000) + 60,
    })

    return `${header}.${payload}.`
  }

  for (const alg of ['none', 'None', 'NONE']) {
    it(`should return 401 for alg "${alg}"`, async () => {
      const response = await request(app)
        .get('/leads')
        .set('Authorization', bearer(unsignedToken(alg)))

      expect(response.statusCode).toBe(401)
      expect(response.body).toEqual(INVALID_TOKEN)
    })
  }
})

describe('JWT: expired token', () => {
  it('should return 401 when exp is in the past', async () => {
    const expired = signToken(
      { sub: user.id, role: user.roleId },
      { expiresIn: -60 },
    )

    const response = await request(app)
      .get('/leads')
      .set('Authorization', bearer(expired))

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual(INVALID_TOKEN)
  })
})

describe('JWT: refresh token', () => {
  it('should return 401 when a used refresh token is reused', async () => {
    const { refreshToken } = await signIn(user)

    const first = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })
    const reused = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })

    expect(first.statusCode).toBe(200)
    expect(reused.statusCode).toBe(401)
  })
})
