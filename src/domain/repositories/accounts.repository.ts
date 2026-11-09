import type { IAccount } from '@entities/account.entity.ts'

export interface IAccountsRepository {
  findAccountByEmail(email: string): Promise<IAccount | null>
  createAccount(account: Omit<IAccount, 'id'>): Promise<void>
}
