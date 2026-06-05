import type { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import isAuth from '../isAuth'
import * as authService from 'src/features/auth/auth.service'
import jwt from 'jsonwebtoken'

jest.mock('src/config', () => ({
    config: {
        jwt: {
            access_token: {
                secret: 'test-access-secret',
            },
        },
    },
}))

jest.mock('src/features/auth/auth.service')
jest.mock('../logger', () => ({
    __esModule: true,
    default: {
        warn: jest.fn(),
    },
}))

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}))

describe('isAuth middleware', () => {
    let req: Partial<Request>
    let res: Partial<Response>
    let next: NextFunction

    beforeEach(() => {
        req = {
            headers: {},
            method: 'GET',
            originalUrl: '/api/v1/auth/me',
        }
        res = {}
        next = jest.fn()
        jest.clearAllMocks()
    })

    it('returns unauthorized when Authorization header is missing', async () => {
        await isAuth(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
            HttpStatus.UNAUTHORIZED
        )
    })

    it('returns forbidden when token is invalid', async () => {
        req.headers = {
            authorization: 'Bearer invalid-token',
        }
        ;(jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('invalid token')
        })

        await isAuth(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
            HttpStatus.FORBIDDEN
        )
    })

    it('returns forbidden when authenticated account is locked', async () => {
        req.headers = {
            authorization: 'Bearer valid-token',
        }
        ;(jwt.verify as jest.Mock).mockReturnValue({
            userId: 'user-123',
            role: 'LCD',
        })
        ;(authService.getUserById as jest.Mock).mockResolvedValue({
            id: 'user-123',
            role: 'LCD',
            status: 'LOCKED',
        })

        await isAuth(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
            HttpStatus.FORBIDDEN
        )
    })

    it('attaches payload and calls next when user is active', async () => {
        req.headers = {
            authorization: 'Bearer valid-token',
        }
        ;(jwt.verify as jest.Mock).mockReturnValue({
            userId: 'user-123',
            role: 'LCD',
        })
        ;(authService.getUserById as jest.Mock).mockResolvedValue({
            id: 'user-123',
            role: 'LCD',
            status: 'ACTIVE',
        })

        await isAuth(req as Request, res as Response, next)

        expect(req.payload).toEqual({
            userId: 'user-123',
            role: 'LCD',
        })
        expect(next).toHaveBeenCalledWith()
    })
})
