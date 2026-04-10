import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { UserRole } from 'src/features/auth/types'

export const createAccessToken = (
    userId: number | string,
    role: UserRole
): string => {
    return jwt.sign({ userId, role }, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire,
    } as jwt.SignOptions)
}

export const createRefreshToken = (userId: number | string): string => {
    return jwt.sign({ userId }, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire,
    } as jwt.SignOptions)
}
