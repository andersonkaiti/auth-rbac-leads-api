import type { IRefreshToken } from '@entities/refresh-token.entity.ts'

export interface IRotateRefreshToken {
  incomingRefreshToken: IRefreshToken['id']
  accountId: IRefreshToken['accountId']
  newRefreshTokenExpiringDate: IRefreshToken['expiresAt']
}

export interface IRefreshTokenWithRole extends IRefreshToken {
  account: {
    roleId: string
  }
}

export interface IRefreshTokensRepository {
  create(data: Omit<IRefreshToken, 'id' | 'issuedAt'>): Promise<IRefreshToken>
  findByToken(
    data: Pick<IRefreshToken, 'id'>,
  ): Promise<IRefreshTokenWithRole | null>
  rotateRefreshToken(data: IRotateRefreshToken): Promise<IRefreshToken>
  delete(data: IRefreshToken['id']): Promise<void>
  deleteManyByUserId(accountId: IRefreshToken['accountId']): Promise<void>
}
