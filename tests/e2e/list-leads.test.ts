import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { hash } from 'bcryptjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let userAccessToken: string
let adminAccessToken: string

beforeAll(async () => {
  const password = faker.internet.password({ length: 8 })
  const hashedPassword = await hash(password, 8)

  const userRole = await prisma.role.findFirst({ where: { name: 'USER' } })
  if (!userRole) {
    throw new Error('USER role not found')
  }
  const userEmail = faker.internet.email()

  await request(app).post('/sign-up').send({
    name: faker.person.fullName(),
    email: userEmail,
    password,
    roleId: userRole.id,
  })

  const userSignIn = await request(app)
    .post('/sign-in')
    .send({ email: userEmail, password })
  userAccessToken = userSignIn.body.accessToken

  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    throw new Error('ADMIN role not found')
  }
  const adminEmail = faker.internet.email()

  await prisma.account.create({
    data: {
      name: faker.person.fullName(),
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
    },
  })

  const adminSignIn = await request(app)
    .post('/sign-in')
    .send({ email: adminEmail, password })
  adminAccessToken = adminSignIn.body.accessToken
})

afterAll(async () => {
  await prisma.lead.deleteMany()
  await prisma.account.deleteMany()
})

describe('List Leads tests', () => {
  it('should return leads when authenticated as USER', async () => {
    const response = await request(app)
      .get('/leads')
      .set('Authorization', `Bearer ${userAccessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('leads')
    expect(Array.isArray(response.body.leads)).toBe(true)
  })

  it('should return leads with id, name and email fields', async () => {
    await prisma.lead.create({
      data: { name: faker.person.fullName(), email: faker.internet.email() },
    })

    const response = await request(app)
      .get('/leads')
      .set('Authorization', `Bearer ${userAccessToken}`)

    expect(response.statusCode).toBe(200)

    const [lead] = response.body.leads
    expect(lead).toHaveProperty('id')
    expect(lead).toHaveProperty('name')
    expect(lead).toHaveProperty('email')
  })

  it('should return 403 when authenticated as ADMIN', async () => {
    const response = await request(app)
      .get('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({ error: 'Access denied' })
  })

  it('should return 401 when Authorization header is missing', async () => {
    const response = await request(app).get('/leads')

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })

  it('should return 401 when prefix is not Bearer', async () => {
    const response = await request(app)
      .get('/leads')
      .set('Authorization', `Token ${userAccessToken}`)

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/leads')
      .set('Authorization', 'Bearer invalid.token.value')

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })
})
