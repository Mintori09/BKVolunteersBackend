import type { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import jwt from 'jsonwebtoken'
import { config } from 'src/config'

const isAuth = (req: Request, res: Response, next: NextFunction) => {
    // token looks like 'Bearer vnjaknvijdaknvikbnvreiudfnvriengviewjkdsbnvierj'

    const authHeader = req.headers?.authorization

    if (!authHeader || !authHeader?.startsWith('Bearer ')) {
        return res.sendStatus(httpStatus.UNAUTHORIZED)
    }

    const token: string | undefined = authHeader.split(' ')[1]

    if (!token) return res.sendStatus(httpStatus.UNAUTHORIZED)

    jwt.verify(
        token,
        config.jwt.access_token.secret,
        (err: unknown, payload: unknown) => {
            if (err) return res.sendStatus(httpStatus.FORBIDDEN) // invalid token
            req.payload = payload as jwt.JwtPayload

            next()
        }
    )
}

export default isAuth
