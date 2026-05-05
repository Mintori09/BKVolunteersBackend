import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { config } from 'src/config'
import { AccountType, ContractRole } from 'src/contract/types'

interface AccessTokenPayload {
    userId: string
    accountType: AccountType
    role: ContractRole
    organizationId?: string | null
    facultyId?: string | null
}

type TokenId = string | number | bigint | null | undefined

const toTokenId = (id: TokenId): string | null =>
    id === null || id === undefined ? null : String(id)

export const createAccessToken = (
    userId: number | string | bigint,
    accountType: AccountType,
    role: ContractRole,
    organizationId?: TokenId,
    facultyId?: TokenId
): string => {
    const payload: AccessTokenPayload = {
        userId: String(userId),
        accountType,
        role,
    }
    if (organizationId !== undefined) {
        payload.organizationId = toTokenId(organizationId)
    }
    if (facultyId !== undefined) {
        payload.facultyId = toTokenId(facultyId)
    }
    return jwt.sign(payload, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire,
    } as jwt.SignOptions)
}

export const createRefreshToken = (userId: number | string | bigint): string => {
    return jwt.sign(
        {
            userId: String(userId),
            jti: randomUUID(),
        },
        config.jwt.refresh_token.secret,
        {
            expiresIn: config.jwt.refresh_token.expire,
        } as jwt.SignOptions
    )
}
