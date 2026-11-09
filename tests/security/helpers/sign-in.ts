import { app } from '@infra/http/app.ts'
import request from 'supertest'

export async function signIn(credentials: { email: string; password: string }) {
  const response = await request(app).post('/sign-in').send(credentials)

  return response.body as { accessToken: string; refreshToken: string }
}
