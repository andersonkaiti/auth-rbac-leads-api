import { prisma } from '@database/prisma/index.ts'
import { faker } from '@faker-js/faker'
import { app } from '@infra/http/app.ts'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'

async function createRefreshToken() {
  const email = faker.internet.email()
  const password = faker.internet.password({ length: 8 })

  await request(app).post('/sign-up').send({
    name: faker.person.fullName(),
    email,
    password,
  })

  const response = await request(app).post('/sign-in').send({ email, password })

  return response.body.refreshToken as string
}

afterAll(async () => {
  await prisma.account.deleteMany()
})

describe('Refresh Token tests', () => {
  it('should return new access and refresh tokens', async () => {
    const refreshToken = await createRefreshToken()

    const response = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })

    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('accessToken')
    expect(response.body).toHaveProperty('refreshToken')
    expect(typeof response.body.accessToken).toBe('string')
    expect(typeof response.body.refreshToken).toBe('string')
  })

  it('should return an access token that is a JWT with three parts', async () => {
    const refreshToken = await createRefreshToken()

    const response = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })

    const parts = response.body.accessToken.split('.')
    expect(parts).toHaveLength(3)
  })

  it('should return 400 when refreshToken is missing', async () => {
    const response = await request(app).post('/refresh-token').send({})

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when refreshToken is not a string', async () => {
    const response = await request(app)
      .post('/refresh-token')
      .send({ refreshToken: 123 })

    expect(response.statusCode).toBe(400)
  })

  it('should return 401 when the refresh token does not exist', async () => {
    const response = await request(app)
      .post('/refresh-token')
      .send({ refreshToken: faker.string.uuid() })

    expect(response.statusCode).toBe(401)
    expect(response.body).toEqual({ error: 'Invalid refresh token' })
  })

  it('should invalidate the old refresh token after it is rotated', async () => {
    const refreshToken = await createRefreshToken()

    const firstResponse = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })

    expect(firstResponse.statusCode).toBe(200)

    const reuseResponse = await request(app)
      .post('/refresh-token')
      .send({ refreshToken })

    expect(reuseResponse.statusCode).toBe(401)
    expect(reuseResponse.body).toEqual({ error: 'Invalid refresh token' })
  })

  it('should return 500 when refreshToken is not a valid UUID', async () => {
    const response = await request(app)
      .post('/refresh-token')
      .send({ refreshToken: 'not-a-valid-token' })

    expect(response.statusCode).toBe(500)
  })
})
