import { prisma } from '@database/prisma/index.ts'

export async function cleanDatabase() {
  await prisma.lead.deleteMany()
  await prisma.account.deleteMany()
}
