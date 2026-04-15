import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { UserRole } from 'src/features/auth/types'

interface AccessTokenPayload {
    userId: string | number
    role: UserRole
    facultyId?: string | null
}

export const createAccessToken = (
    userId: number | string,
    role: UserRole,
    facultyId?: string | null
): string => {
    const payload: AccessTokenPayload = { userId, role }
    if (facultyId !== undefined) {
        payload.facultyId = facultyId
    }
    return jwt.sign(payload, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire,
    } as jwt.SignOptions)
}

export const createRefreshToken = (userId: number | string): string => {
    return jwt.sign({ userId }, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire,
    } as jwt.SignOptions)
}
