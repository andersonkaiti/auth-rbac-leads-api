export function base64Url(value: object | string): string {
  const content = typeof value === 'string' ? value : JSON.stringify(value)

  return Buffer.from(content).toString('base64url')
}
