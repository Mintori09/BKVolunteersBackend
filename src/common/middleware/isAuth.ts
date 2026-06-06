import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { HttpStatus } from 'src/common/constants'
import { config } from 'src/config'
import * as authService from 'src/features/auth/auth.service'
import { ApiError } from 'src/utils/ApiError'
import logger from './logger'

const isAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers?.authorization

    if (
        !authHeader ||
        (!authHeader.startsWith('Bearer ') &&
            !authHeader.startsWith('Apikey '))
    ) {
        return next(new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung'))
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
        return next(new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung'))
    }

    try {
        const payload = jwt.verify(
            token,
            config.jwt.access_token.secret
        ) as jwt.JwtPayload

        if (!payload?.userId || !payload?.role) {
            return next(
                new ApiError(HttpStatus.UNAUTHORIZED, 'Token khong hop le')
            )
        }

        const user = await authService.getUserById(payload.userId, payload.role)

        if (!user || user.status !== 'ACTIVE') {
            logger.warn(
                `Denied inactive account access userId=${payload.userId} role=${payload.role} method=${req.method} path=${req.originalUrl}`
            )
            return next(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Tai khoan da bi khoa hoac vo hieu hoa'
                )
            )
        }

        req.payload = {
            ...payload,
            userId: user.id,
            role: user.role,
        }

        next()
    } catch {
        logger.warn(
            `Denied invalid token method=${req.method} path=${req.originalUrl}`
        )
        return next(new ApiError(HttpStatus.UNAUTHORIZED, 'Token khong hop le'))
    }
}

export default isAuth
