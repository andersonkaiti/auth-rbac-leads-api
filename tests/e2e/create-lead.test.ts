import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import { hash } from 'bcryptjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let adminAccessToken: string
let userAccessToken: string

beforeAll(async () => {
  const password = faker.internet.password({ length: 8 })
  const hashedPassword = await hash(password, 8)

  const adminEmail = faker.internet.email()
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } })
  if (!adminRole) {
    throw new Error('ADMIN role not found')
  }

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
})

afterAll(async () => {
  await prisma.lead.deleteMany()
  await prisma.account.deleteMany()
})

describe('Create Lead tests', () => {
  it('should create a lead when authenticated as ADMIN', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: faker.person.fullName(), email: faker.internet.email() })

    expect(response.statusCode).toBe(201)
  })

  it('should return 409 when email is already in use', async () => {
    const email = faker.internet.email()

    await prisma.lead.create({ data: { name: faker.person.fullName(), email } })

    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: faker.person.fullName(), email })

    expect(response.statusCode).toBe(409)
    expect(response.body).toEqual({
      error: 'Another lead have the same e-mail',
    })
  })

  it('should return 403 when authenticated as USER', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send({ name: faker.person.fullName(), email: faker.internet.email() })

    expect(response.statusCode).toBe(403)
    expect(response.body).toEqual({ error: 'Access denied' })
  })

  it('should return 400 when name is missing', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ email: faker.internet.email() })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is invalid', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: faker.person.fullName(), email: 'not-an-email' })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is missing', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ name: faker.person.fullName() })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when body is empty', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({})

    expect(response.statusCode).toBe(400)
  })

  it('should return 401 when Authorization header is missing', async () => {
    const response = await request(app).post('/leads')

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })

  it('should return 401 when prefix is not Bearer', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', `Token ${adminAccessToken}`)

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .post('/leads')
      .set('Authorization', 'Bearer invalid.token.value')

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid access token' })
  })
})
