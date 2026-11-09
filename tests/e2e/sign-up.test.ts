import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

afterAll(async () => {
  await prisma.account.deleteMany()
})

describe('Sign Up tests', () => {
  it('should create an account', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(204)
  })

  it('should return 409 when email is already in use', async () => {
    const email = faker.internet.email()

    await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email,
        password: faker.internet.password({ length: 8 }),
      })

    const response = await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email,
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(409)
    expect(response.body).toEqual({ error: 'This e-mail is already in use' })
  })

  it('should return 400 when name is shorter than 2 characters', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: 'A',
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is invalid', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email: 'not-an-email',
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when password is shorter than 8 characters', async () => {
    const response = await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '1234567',
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when name is missing', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is missing', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when password is missing', async () => {
    const response = await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when body is empty', async () => {
    const response = await request(app).post('/sign-up').send({})

    expect(response.statusCode).toBe(400)
  })

  it('should accept name with exactly 2 characters', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: 'AB',
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(204)
  })

  it('should accept password with exactly 8 characters', async () => {
    const response = await request(app).post('/sign-up').send({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: '12345678',
    })

    expect(response.statusCode).toBe(204)
  })

  it('should return no body on success', async () => {
    const response = await request(app)
      .post('/sign-up')
      .send({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 8 }),
      })

    expect(response.statusCode).toBe(204)
    expect(response.body).toEqual({})
  })
})
