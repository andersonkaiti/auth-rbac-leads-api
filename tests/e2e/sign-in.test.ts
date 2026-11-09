import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

afterAll(async () => {
  await prisma.account.deleteMany()
})

describe('Sign In tests', () => {
  it('should sign in and return access and refresh tokens', async () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 8 })

    await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email,
      password,
    })

    const response = await request(app)
      .post('/sign-in')
      .send({ email, password })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
    expect(typeof response.body.accessToken).toBe('string')
    expect(response.body.refreshToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('should return 401 when email is not registered', async () => {
    const response = await request(app)
      .post('/sign-in')
      .send({
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid credentials' })
  })

  it('should return 401 when password is wrong', async () => {
    const email = faker.internet.email()

    await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email,
        password: faker.internet.password({ length: 8 }),
      })

    const response = await request(app).post('/sign-in').send({
      email,
      password: 'wrong-password',
    })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid credentials' })
  })

  it('should return 400 when email is invalid', async () => {
    const response = await request(app)
      .post('/sign-in')
      .send({
        email: 'not-an-email',
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when password is shorter than 8 characters', async () => {
    const response = await request(app).post('/sign-in').send({
      email: faker.internet.email(),
      password: '1234567',
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is missing', async () => {
    const response = await request(app)
      .post('/sign-in')
      .send({
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when password is missing', async () => {
    const response = await request(app).post('/sign-in').send({
      email: faker.internet.email(),
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when body is empty', async () => {
    const response = await request(app).post('/sign-in').send({})

    expect(response.statusCode).toBe(400)
  })

  it('should sign in with password of exactly 8 characters', async () => {
    const email = faker.internet.email()
    const password = '12345678'

    await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email,
      password,
    })

    const response = await request(app)
      .post('/sign-in')
      .send({ email, password })

    expect(response.statusCode).toBe(200)
  })

  it('should return a JWT with three parts separated by dots', async () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 8 })

    await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email,
      password,
    })

    const response = await request(app)
      .post('/sign-in')
      .send({ email, password })

    const parts = response.body.accessToken.split('.')
    expect(parts).toHaveLength(3)
  })
})
