import { Router } from 'express'
import * as argon2 from 'argon2'
import { prismaClient } from 'src/config'
import isAuth from 'src/common/middleware/isAuth'
import { ApiResponse } from 'src/utils/ApiResponse'
import { createAccessToken, createRefreshToken } from 'src/utils/generateTokens.util'
import type { AccountType, ContractRole } from 'src/contract/types'

const authRouter = Router()

const toId = (id: bigint | number | string | null | undefined) =>
    id == null ? null : String(id)

const mapStudentAccount = (student: {
    id: bigint
    facultyId: bigint
    studentCode: string
    email: string
    fullName: string
}) => ({
    id: toId(student.id),
    account_type: 'STUDENT' satisfies AccountType,
    role: 'STUDENT' satisfies ContractRole,
    email: student.email,
    full_name: student.fullName,
    faculty_id: toId(student.facultyId),
    organization_id: null,
    student_code: student.studentCode,
})

const mapOperatorAccount = (operator: {
    id: bigint
    organizationId: bigint | null
    facultyId: bigint | null
    email: string
    fullName: string
    role: ContractRole
}) => ({
    id: toId(operator.id),
    account_type: 'OPERATOR' satisfies AccountType,
    role: operator.role,
    email: operator.email,
    full_name: operator.fullName,
    organization_id: toId(operator.organizationId),
    faculty_id: toId(operator.facultyId),
    student_code: null,
})

authRouter.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body ?? {}

        if (!email || !password) {
            return ApiResponse.error(
                res,
                'Email and password are required',
                400,
                undefined,
                'AUTH_INVALID_PAYLOAD'
            )
        }

        const student = await prismaClient.student.findUnique({
            where: { email },
        })

        if (student && (await argon2.verify(student.passwordHash, password))) {
            const accessToken = createAccessToken(
                student.id,
                'STUDENT',
                'STUDENT',
                undefined,
                student.facultyId
            )
            const refreshToken = createRefreshToken(student.id)

            await prismaClient.refreshToken.create({
                data: {
                    accountType: 'STUDENT',
                    studentId: student.id,
                    tokenHash: refreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            })

            return ApiResponse.success(
                res,
                {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    account: mapStudentAccount(student),
                },
                'Logged in successfully'
            )
        }

        const operator = await prismaClient.operatorAccount.findUnique({
            where: { email },
        })

        if (
            operator &&
            (await argon2.verify(operator.passwordHash, password))
        ) {
            const accessToken = createAccessToken(
                operator.id,
                'OPERATOR',
                operator.role,
                operator.organizationId,
                operator.facultyId
            )
            const refreshToken = createRefreshToken(operator.id)

            await prismaClient.refreshToken.create({
                data: {
                    accountType: 'OPERATOR',
                    operatorAccountId: operator.id,
                    tokenHash: refreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            })

            return ApiResponse.success(
                res,
                {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    account: mapOperatorAccount(operator),
                },
                'Logged in successfully'
            )
        }

        return ApiResponse.error(
            res,
            'Invalid email or password',
            401,
            undefined,
            'AUTH_INVALID_CREDENTIALS'
        )
    } catch (error) {
        next(error)
    }
})

authRouter.post('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.body?.refresh_token ?? req.cookies?.refresh_token

        if (!refreshToken) {
            return ApiResponse.error(
                res,
                'Refresh token is required',
                401,
                undefined,
                'AUTH_REFRESH_TOKEN_REQUIRED'
            )
        }

        const storedToken = await prismaClient.refreshToken.findUnique({
            where: { tokenHash: refreshToken },
            include: {
                student: true,
                operatorAccount: true,
            },
        })

        if (
            !storedToken ||
            storedToken.revokedAt ||
            storedToken.expiresAt.getTime() < Date.now()
        ) {
            return ApiResponse.error(
                res,
                'Refresh token is invalid or expired',
                401,
                undefined,
                'AUTH_REFRESH_TOKEN_INVALID'
            )
        }

        if (storedToken.accountType === 'STUDENT' && storedToken.student) {
            const accessToken = createAccessToken(
                storedToken.student.id,
                'STUDENT',
                'STUDENT',
                undefined,
                storedToken.student.facultyId
            )

            return ApiResponse.success(res, {
                access_token: accessToken,
                account: mapStudentAccount(storedToken.student),
            })
        }

        if (
            storedToken.accountType === 'OPERATOR' &&
            storedToken.operatorAccount
        ) {
            const accessToken = createAccessToken(
                storedToken.operatorAccount.id,
                'OPERATOR',
                storedToken.operatorAccount.role,
                storedToken.operatorAccount.organizationId,
                storedToken.operatorAccount.facultyId
            )

            return ApiResponse.success(res, {
                access_token: accessToken,
                account: mapOperatorAccount(storedToken.operatorAccount),
            })
        }

        return ApiResponse.error(
            res,
            'Refresh token account is missing',
            401,
            undefined,
            'AUTH_REFRESH_ACCOUNT_MISSING'
        )
    } catch (error) {
        next(error)
    }
})

authRouter.post('/logout', async (req, res, next) => {
    try {
        const refreshToken = req.body?.refresh_token ?? req.cookies?.refresh_token

        if (!refreshToken) {
            return ApiResponse.success(
                res,
                { revoked: false },
                'Logged out'
            )
        }

        const result = await prismaClient.refreshToken.updateMany({
            where: {
                tokenHash: refreshToken,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        })

        return ApiResponse.success(
            res,
            { revoked: result.count > 0 },
            'Logged out'
        )
    } catch (error) {
        next(error)
    }
})

authRouter.get('/me', isAuth, async (req, res, next) => {
    try {
        const payload = req.payload
        const accountId = payload?.userId ? BigInt(payload.userId) : null

        if (!payload?.accountType || !accountId) {
            return ApiResponse.error(
                res,
                'Access token payload is invalid',
                401,
                undefined,
                'AUTH_INVALID_ACCESS_TOKEN'
            )
        }

        if (payload.accountType === 'STUDENT') {
            const student = await prismaClient.student.findUnique({
                where: { id: accountId },
            })
            return ApiResponse.success(
                res,
                student ? mapStudentAccount(student) : null,
                'Current account fetched successfully'
            )
        }

        const operator = await prismaClient.operatorAccount.findUnique({
            where: { id: accountId },
        })
        return ApiResponse.success(
            res,
            operator ? mapOperatorAccount(operator) : null,
            'Current account fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

authRouter.patch('/me/password', (_req, res) =>
    ApiResponse.success(
        res,
        { changed: true, contract_only: true },
        'Password change contract is ready'
    )
)

export default authRouter
