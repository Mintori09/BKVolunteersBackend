import type { CookieOptions } from 'express'
import config from './config'

const isProduction = config.node_env === 'production'

export const refreshTokenCookieConfig: CookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
}

export const clearRefreshTokenCookieConfig: CookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
}
