import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { AuthTokenPayload } from 'src/features/auth/types'

// @ts-expect-error
const { sign } = jwt

export const createAccessToken = (payload: AuthTokenPayload): string => {
    return sign(payload, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire as any,
    })
}

export const createRefreshToken = (payload: AuthTokenPayload): string => {
    return sign(payload, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire as any,
    })
}
