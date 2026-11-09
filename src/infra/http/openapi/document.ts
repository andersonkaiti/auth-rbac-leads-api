import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from '@infra/http/openapi/registry.ts'

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Node Auth API',
      version: '1.0.0',
      description: 'Authentication and leads management API.',
    },
    servers: [{ url: '/' }],
  })
}
