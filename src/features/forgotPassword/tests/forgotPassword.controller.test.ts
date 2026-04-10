import { HttpStatus } from 'src/common/constants'
import {
    handleForgotPassword,
    handleResetPassword,
} from 'src/features/forgotPassword/forgotPassword.controller'
import { prismaClient } from 'src/config'
import * as argon2 from 'argon2'
import { Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import { sendResetEmail } from 'src/utils/sendEmail.util'

// Mock dependencies
jest.mock('src/config', () => ({
    prismaClient: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        resetToken: {
            create: jest.fn(),
            findFirst: jest.fn(),
            deleteMany: jest.fn(),
        },
        refreshToken: {
            deleteMany: jest.fn(),
        },
    },
    config: {
        node_env: 'test',
    },
}))

jest.mock('argon2')
jest.mock('node:crypto')
jest.mock('src/utils/sendEmail.util')

describe('Forgot Password Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            params: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleForgotPassword', () => {
        it('should return 400 if email is missing', async () => {
            req.body = {}
            await handleForgotPassword(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST })
            )
        })

        it('should return 404 if user is not found', async () => {
            req.body = { email: 'test@example.com' }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null)

            await handleForgotPassword(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND })
            )
        })

        it('should send reset email and return 200', async () => {
            req.body = { email: 'test@example.com' }
            const user = { id: '1' }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(user)
            ;(randomUUID as jest.Mock).mockReturnValue('token')

            await handleForgotPassword(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
        })
    })

    describe('handleResetPassword', () => {
        it('should return 404 if token is missing', async () => {
            req.params = {}
            await handleResetPassword(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND })
            )
        })

        it('should return 404 if token is invalid or expired', async () => {
            req.params = { token: 'token' }
            req.body = { newPassword: 'password' }
            ;(prismaClient.resetToken.findFirst as jest.Mock).mockResolvedValue(
                null
            )

            await handleResetPassword(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND })
            )
        })

        it('should update password and return 200', async () => {
            req.params = { token: 'token' }
            req.body = { newPassword: 'password' }
            const resetToken = { id: '1', userId: '1' }
            ;(prismaClient.resetToken.findFirst as jest.Mock).mockResolvedValue(
                resetToken
            )
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed')

            await handleResetPassword(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
        })
    })
})
