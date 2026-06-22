import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { UserRole } from 'src/features/auth/types'
import { AccountType } from 'src/common/types/canonical.types'

interface AccessTokenPayload {
    userId: string | number
    accountType: AccountType
    role: UserRole
    organizationId?: string | number | null
    facultyId?: string | number | null
}

export const createAccessToken = (
    userId: number | string,
    accountType: AccountType,
    role: UserRole,
    organizationId?: string | number | null,
    facultyId?: string | number | null
): string => {
    const payload: AccessTokenPayload = { userId, accountType, role }
    if (organizationId !== undefined) {
        payload.organizationId = organizationId
    }
    if (facultyId !== undefined) {
        payload.facultyId = facultyId
    }
    return jwt.sign(payload, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire,
    } as jwt.SignOptions)
}

export const createRefreshToken = (
    userId: number | string,
    accountType: AccountType,
    role: UserRole
): string => {
    return jwt.sign({ userId, accountType, role }, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire,
    } as jwt.SignOptions)
}
