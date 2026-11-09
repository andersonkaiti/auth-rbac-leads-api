import { faker } from '@faker-js/faker'

export const newLead = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
})
