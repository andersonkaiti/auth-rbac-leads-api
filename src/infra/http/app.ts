import { makeAuthenticationMiddleware } from '@factories/make-authentication-middleware.factory.ts'
import { makeAuthorizationMiddleware } from '@factories/make-authorization-middleware.factory.ts'
import { makeCreateLeadController } from '@factories/make-create-lead-controller.factory.ts'
import { makeListLeadsController } from '@factories/make-list-leads-controller.factory.ts'
import { makeRefreshTokenController } from '@factories/make-refresh-token-controller.factory.ts'
import { makeSignInController } from '@factories/make-sign-in-controller.factory.ts'
import { makeSignUpController } from '@factories/make-sign-up-controller.factory.ts'
import { middlewareAdapter } from '@infra/http/adapters/middleware.adapter.ts'
import { routeAdapter } from '@infra/http/adapters/route.adapter.ts'
import { errorHandler } from '@infra/http/error-handler.ts'
import { generateOpenApiDocument } from '@infra/http/openapi/document.ts'
import { signInRateLimit } from '@middlewares/sign-in-rate-limit.middleware.ts'
import { apiReference } from '@scalar/express-api-reference'
import cors from 'cors'
import express, { type Express } from 'express'

export const app: Express = express()

app.use(express.json())

app.use(cors())

app.get('/', (_req, res) => {
  res.status(200).json({ message: 'Node Auth API' })
})

app.get('/docs/json', (_req, res) => {
  res.status(200).json(generateOpenApiDocument())
})

app.use('/docs', apiReference({ url: '/docs/json', theme: 'kepler' }))

app.post('/sign-up', routeAdapter(makeSignUpController()))
app.post('/sign-in', signInRateLimit, routeAdapter(makeSignInController()))
app.post('/refresh-token', routeAdapter(makeRefreshTokenController()))

app.get(
  '/leads',
  middlewareAdapter(makeAuthenticationMiddleware()),
  middlewareAdapter(makeAuthorizationMiddleware(['leads:read'])),
  routeAdapter(makeListLeadsController()),
)
app.post(
  '/leads',
  middlewareAdapter(makeAuthenticationMiddleware()),
  middlewareAdapter(makeAuthorizationMiddleware(['leads:write'])),
  routeAdapter(makeCreateLeadController()),
)

app.use(errorHandler)
