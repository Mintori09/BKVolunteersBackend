import jwt from 'jsonwebtoken'
import { config } from 'src/config'

// @ts-expect-error
const { sign } = jwt

export const createAccessToken = (
    userId: number | string,
    role: string
): string => {
    return sign({ userId, role }, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire as any,
    })
}

export const createRefreshToken = (userId: number | string): string => {
    return sign({ userId }, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire as any,
    })
}
