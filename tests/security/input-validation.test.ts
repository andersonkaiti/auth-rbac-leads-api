import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { bearer } from '@tests/security/helpers/bearer.ts'
import { cleanDatabase } from '@tests/security/helpers/clean-database.ts'
import { createAdminAccount } from '@tests/security/helpers/create-admin-account.ts'
import { newLead } from '@tests/security/helpers/new-lead.ts'
import { signIn } from '@tests/security/helpers/sign-in.ts'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Below the 100kb limit of express.json(), to exercise field validation
// rather than the body parser limit.
const HUGE_TEXT = 'a'.repeat(60_000)

let adminToken: string

beforeAll(async () => {
  const admin = await createAdminAccount()
  adminToken = (await signIn(admin)).accessToken
})

afterAll(cleanDatabase)

const newAccount = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 12 }),
})

const postSignUp = (body: object) => request(app).post('/sign-up').send(body)

const postLead = (body: object) =>
  request(app)
    .post('/leads')
    .set('Authorization', bearer(adminToken))
    .send(body)

describe('Input validation: /sign-up (types and empty fields)', () => {
  it.each([
    ['numeric name', { name: 123 }],
    ['name as object', { name: { $ne: null } }],
    ['numeric email', { email: 123 }],
    ['email as object', { email: { $ne: null } }],
    ['numeric password', { password: 12345678 }],
    ['password as array', { password: ['12345678'] }],
    ['null password', { password: null }],
  ])('should return 400 with %s', async (_label, override) => {
    const response = await postSignUp({ ...newAccount(), ...override })

    expect(response.statusCode).toBe(400)
  })
})

describe('Input validation: /sign-up (huge text)', () => {
  it('should return 400 with a huge name', async () => {
    const response = await postSignUp({ ...newAccount(), name: HUGE_TEXT })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 with a huge email', async () => {
    const email = `${HUGE_TEXT}@x.com`
    const response = await postSignUp({ ...newAccount(), email })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 with a huge password', async () => {
    const response = await postSignUp({ ...newAccount(), password: HUGE_TEXT })

    expect(response.statusCode).toBe(400)
  })
})

describe('Input validation: /leads', () => {
  it('should return 400 with an empty name', async () => {
    const response = await postLead({ ...newLead(), name: '' })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 with a huge name', async () => {
    const response = await postLead({ ...newLead(), name: HUGE_TEXT })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 with a huge email', async () => {
    const email = `${HUGE_TEXT}@x.com`
    const response = await postLead({ ...newLead(), email })

    expect(response.statusCode).toBe(400)
  })
})

describe('Input validation: /sign-in', () => {
  it('should return 400 with a huge password', async () => {
    const response = await request(app)
      .post('/sign-in')
      .send({ email: faker.internet.email(), password: HUGE_TEXT })

    expect(response.statusCode).toBe(400)
  })
})

describe('Input validation: malformed or oversized body', () => {
  it('should return 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/sign-in')
      .set('Content-Type', 'application/json')
      .send('{"email": ')

    expect(response.statusCode).toBe(400)
  })

  it('should return 413 for a body above 100kb', async () => {
    const response = await postSignUp({
      ...newAccount(),
      name: 'a'.repeat(200_000),
    })

    expect(response.statusCode).toBe(413)
  })
})
