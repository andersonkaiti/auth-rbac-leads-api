export function decodePayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.')

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}
