import { HttpStatus } from 'src/common/constants'
import {
    sendVerificationEmail,
    handleVerifyEmail,
} from 'src/features/verifyEmail/verifyEmail.controller'
import { prismaClient } from 'src/config'
import { Response, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'

// Mock dependencies
jest.mock('src/config', () => ({
    prismaClient: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        emailVerificationToken: {
            create: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
    config: {
        node_env: 'test',
        cors: {
            cors_origin: 'http://localhost:3000',
        },
    },
}))

jest.mock('node:crypto')
jest.mock('src/utils/sendEmail.util')

describe('Verify Email Controller', () => {
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

    describe('sendVerificationEmail', () => {
        it('should return 400 if email is missing', async () => {
            req.body = {}
            await sendVerificationEmail(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST })
            )
        })

        it('should return 404 if email not found', async () => {
            req.body = { email: 'notfound@example.com' }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null)

            await sendVerificationEmail(req, res, next)
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.NOT_FOUND })
            )
        })

        it('should create token and send email if user is not verified', async () => {
            req.body = { email: 'test@example.com' }
            const user = {
                id: '1',
                emailVerified: null,
                email: 'test@example.com',
            }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(user)
            ;(
                prismaClient.emailVerificationToken.findFirst as jest.Mock
            ).mockResolvedValue(null)
            ;(randomUUID as jest.Mock).mockReturnValue('token')

            await sendVerificationEmail(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
        })
    })

    describe('handleVerifyEmail', () => {
        it('should return 410 if token is invalid or expired', async () => {
            req.params = { token: 'token' }
            ;(
                prismaClient.emailVerificationToken.findUnique as jest.Mock
            ).mockResolvedValue(null)

            await handleVerifyEmail(req, res, next)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.GONE)
        })

        it('should verify email and return 200', async () => {
            req.params = { token: 'token' }
            const verificationToken = {
                id: '1',
                userId: '1',
                expiresAt: new Date(Date.now() + 100000),
            }
            ;(
                prismaClient.emailVerificationToken.findUnique as jest.Mock
            ).mockResolvedValue(verificationToken)

            await handleVerifyEmail(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
        })
    })
})
