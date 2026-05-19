import type { NextFunction, Request, Response } from 'express'

import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { ApiResponse } from 'src/utils/ApiResponse'

const isAuth = (req: Request, res: Response, next: NextFunction) => {
    // token looks like 'Bearer vnjaknvijdaknvikbnvreiudfnvriengviewjkdsbnvierj'

    const authHeader = req.headers?.authorization

    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
        return ApiResponse.error(
            res,
            'Access token is required',
            401,
            undefined,
            'AUTH_ACCESS_TOKEN_REQUIRED'
        )
    }

    const token: string | undefined = authHeader.split(' ')[1]

    if (!token) {
        return ApiResponse.error(
            res,
            'Access token is required',
            401,
            undefined,
            'AUTH_ACCESS_TOKEN_REQUIRED'
        )
    }

    jwt.verify(
        token,
        config.jwt.access_token.secret,
        (err: unknown, payload: unknown) => {
            if (err) {
                return ApiResponse.error(
                    res,
                    'Access token is invalid or expired',
                    401,
                    undefined,
                    'AUTH_ACCESS_TOKEN_INVALID'
                )
            }
            req.payload = payload as jwt.JwtPayload

            next()
        }
    )
}

export default isAuth
