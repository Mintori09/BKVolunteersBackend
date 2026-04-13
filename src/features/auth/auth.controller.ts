import { Request, Response } from 'express'
import * as argon2 from 'argon2'
import { HttpStatus } from 'src/common/constants'
import {
    clearRefreshTokenCookieConfig,
    config,
    refreshTokenCookieConfig,
} from 'src/config'
import { TypedRequest } from 'src/types/request'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as authService from './auth.service'
import {
    AuthSubjectType,
    ChangePasswordData,
    ManagerLoginCredentials,
    UserLoginCredentials,
    UserSignUpCredentials,
} from './types'

type ManagerAccountRecord = NonNullable<
    Awaited<ReturnType<typeof authService.getManagerByIdentifier>>
>

const getAuthSubjectType = (
    payload?: Partial<{ role: string; subjectType: string }>
): AuthSubjectType => {
    if (payload?.subjectType === 'student' || payload?.role === 'STUDENT') {
        return 'student'
    }

    if (payload?.subjectType === 'manager') {
        return 'manager'
    }

    return 'user'
}

const clearExistingRefreshCookie = async (
    req: Pick<Request, 'cookies'>,
    res: Response
) => {
    const refreshToken = req.cookies?.[config.jwt.refresh_token.cookie_name]

    if (!refreshToken) {
        return
    }

    const foundUserRefreshToken =
        await authService.getRefreshTokenByToken(refreshToken)
    const foundStudentRefreshToken = foundUserRefreshToken
        ? null
        : await authService.getStudentRefreshTokenByToken(refreshToken)

    if (foundUserRefreshToken) {
        await authService.deleteRefreshToken(refreshToken)
    }

    if (foundStudentRefreshToken) {
        await authService.deleteStudentRefreshToken(refreshToken)
    }

    res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
    )
}

const completeManagerLogin = async (
    manager: ManagerAccountRecord,
    req: Pick<Request, 'cookies'>,
    res: Response
) => {
    await clearExistingRefreshCookie(req, res)

    const { accessToken, refreshToken } =
        await authService.createManagerSession(manager)
    const sessionUser = await authService.buildSessionUser({
        userId: manager.id,
        subjectType: 'manager',
    })

    res.cookie(
        config.jwt.refresh_token.cookie_name,
        refreshToken,
        refreshTokenCookieConfig
    )

    return ApiResponse.success(res, {
        accessToken,
        user: sessionUser,
    })
}

export const handleSignup = catchAsync(
    async (req: TypedRequest<UserSignUpCredentials>, res: Response) => {
        const {
            firstName,
            lastName,
            username,
            email,
            password,
            passwordConfirmed,
        } = req.body

        if (
            !firstName ||
            !lastName ||
            !username ||
            !email ||
            !password ||
            !passwordConfirmed
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'First name, last name, username, email and password are required!'
            )
        }

        if (password !== passwordConfirmed) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Passwords do not match!'
            )
        }

        await authService.createUser(req.body as UserSignUpCredentials)

        return ApiResponse.success(
            res,
            null,
            'New user created',
            HttpStatus.CREATED
        )
    }
)

export const handleLogin = catchAsync(
    async (req: TypedRequest<UserLoginCredentials>, res: Response) => {
        const { username, password } = req.body

        if (!username || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Username and password are required!'
            )
        }

        const normalizedUsername = username.trim()
        const user = await authService.getUserByUsername(normalizedUsername)

        if (user) {
            if (!user.emailVerified) {
                throw new ApiError(
                    HttpStatus.UNAUTHORIZED,
                    'Your email is not verified! Please confirm your email'
                )
            }

            const isPasswordValid = await argon2.verify(user.password, password)

            if (!isPasswordValid) {
                throw new ApiError(
                    HttpStatus.UNAUTHORIZED,
                    'Invalid username or password'
                )
            }

            await clearExistingRefreshCookie(req, res)

            const { accessToken, refreshToken } = await authService.createSession(
                user.id,
                user.role
            )
            const sessionUser = await authService.buildSessionUser({
                userId: user.id,
                subjectType: 'user',
            })

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                refreshToken,
                refreshTokenCookieConfig
            )

            return ApiResponse.success(res, {
                accessToken,
                user: sessionUser,
            })
        }

        const manager =
            await authService.getManagerByIdentifier(normalizedUsername)

        if (manager) {
            authService.ensureManagerActive(manager)
            authService.ensureManagerContext(manager)
            await authService.verifyManagerPassword(manager, password)

            return completeManagerLogin(manager, req, res)
        }

        const student = await authService.getStudentByMssv(normalizedUsername)

        if (!student) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Invalid username or password'
            )
        }

        authService.ensureStudentActive(student)
        authService.verifyStudentPassword(student, password)

        await clearExistingRefreshCookie(req, res)

        const { accessToken, refreshToken } = await authService.createStudentSession(
            student.id
        )
        const sessionUser = await authService.buildSessionUser({
            userId: student.id,
            subjectType: 'student',
        })

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            refreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success(res, {
            accessToken,
            user: sessionUser,
        })
    }
)

export const handleManagerLogin = catchAsync(
    async (req: TypedRequest<ManagerLoginCredentials>, res: Response) => {
        const { identifier, password } = req.body

        if (!identifier || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Identifier and password are required!'
            )
        }

        const normalizedIdentifier = identifier.trim()
        const manager = await authService.getManagerByIdentifier(
            normalizedIdentifier
        )

        if (!manager) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Invalid manager credentials',
                true,
                {
                    code: 'ERR_INVALID_MANAGER_CREDENTIALS',
                }
            )
        }

        authService.ensureManagerActive(manager)
        authService.ensureManagerContext(manager)
        await authService.verifyManagerPassword(manager, password)

        return completeManagerLogin(manager, req, res)
    }
)

export const handleLogout = catchAsync(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[config.jwt.refresh_token.cookie_name]

    if (!refreshToken) {
        return res.sendStatus(HttpStatus.NO_CONTENT)
    }

    const foundUserRefreshToken =
        await authService.getRefreshTokenByToken(refreshToken)
    const foundStudentRefreshToken = foundUserRefreshToken
        ? null
        : await authService.getStudentRefreshTokenByToken(refreshToken)

    if (foundUserRefreshToken) {
        await authService.deleteRefreshToken(refreshToken)
    }

    if (foundStudentRefreshToken) {
        await authService.deleteStudentRefreshToken(refreshToken)
    }

    res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
    )

    return res.sendStatus(HttpStatus.NO_CONTENT)
})

export const handleRefresh = catchAsync(async (req: Request, res: Response) => {
    const refreshToken: string | undefined =
        req.cookies[config.jwt.refresh_token.cookie_name]

    if (!refreshToken) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Refresh token not found')
    }

    res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
    )

    const foundRefreshToken =
        await authService.getRefreshTokenByToken(refreshToken)
    const foundStudentRefreshToken = foundRefreshToken
        ? null
        : await authService.getStudentRefreshTokenByToken(refreshToken)

    if (!foundRefreshToken && !foundStudentRefreshToken) {
        try {
            const payload = await authService.verifyToken(
                refreshToken,
                config.jwt.refresh_token.secret
            )
            const subjectType = getAuthSubjectType(payload)

            if (subjectType === 'manager') {
                const manager = await authService.getManagerById(payload.userId)

                if (!manager) {
                    throw new ApiError(
                        HttpStatus.FORBIDDEN,
                        'Manager not found'
                    )
                }

                authService.ensureManagerActive(manager)
                authService.ensureManagerContext(manager)

                const { accessToken, refreshToken: newRefreshToken } =
                    await authService.createManagerSession(manager)
                const sessionUser = await authService.buildSessionUser({
                    userId: manager.id,
                    subjectType: 'manager',
                })

                res.cookie(
                    config.jwt.refresh_token.cookie_name,
                    newRefreshToken,
                    refreshTokenCookieConfig
                )

                return ApiResponse.success(res, {
                    accessToken,
                    user: sessionUser,
                })
            }

            if (subjectType === 'student') {
                await authService.deleteAllStudentRefreshTokens(payload.userId)
            } else {
                await authService.deleteAllUserRefreshTokens(payload.userId)
            }
        } catch (_error) {
            // Ignore verification errors here and return a forbidden response below.
        }

        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid refresh token')
    }

    if (foundRefreshToken) {
        await authService.deleteRefreshToken(refreshToken)
    }

    if (foundStudentRefreshToken) {
        await authService.deleteStudentRefreshToken(refreshToken)
    }

    try {
        const payload = await authService.verifyToken(
            refreshToken,
            config.jwt.refresh_token.secret
        )
        const subjectType = getAuthSubjectType(payload)

        if (subjectType === 'student') {
            if (foundStudentRefreshToken?.studentId !== payload.userId) {
                throw new ApiError(HttpStatus.FORBIDDEN, 'User mismatch')
            }

            const student = await authService.getStudentById(payload.userId)

            if (!student) {
                throw new ApiError(HttpStatus.FORBIDDEN, 'Student not found')
            }

            authService.ensureStudentActive(student)

            const { accessToken, refreshToken: newRefreshToken } =
                await authService.createStudentSession(student.id)
            const sessionUser = await authService.buildSessionUser({
                userId: student.id,
                subjectType: 'student',
            })

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                newRefreshToken,
                refreshTokenCookieConfig
            )

            return ApiResponse.success(res, {
                accessToken,
                user: sessionUser,
            })
        }

        if (subjectType === 'manager') {
            const manager = await authService.getManagerById(payload.userId)

            if (!manager) {
                throw new ApiError(HttpStatus.FORBIDDEN, 'Manager not found')
            }

            authService.ensureManagerActive(manager)
            authService.ensureManagerContext(manager)

            const { accessToken, refreshToken: newRefreshToken } =
                await authService.createManagerSession(manager)
            const sessionUser = await authService.buildSessionUser({
                userId: manager.id,
                subjectType: 'manager',
            })

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                newRefreshToken,
                refreshTokenCookieConfig
            )

            return ApiResponse.success(res, {
                accessToken,
                user: sessionUser,
            })
        }

        if (foundRefreshToken?.userId !== payload.userId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'User mismatch')
        }

        const user = await authService.getUserById(payload.userId)

        if (!user) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'User not found')
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await authService.createSession(payload.userId, user.role)
        const sessionUser = await authService.buildSessionUser({
            userId: payload.userId,
            subjectType: 'user',
        })

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            newRefreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success(res, {
            accessToken,
            user: sessionUser,
        })
    } catch (_error) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid refresh token')
    }
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.payload?.userId

    if (!userId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Unauthorized')
    }

    const subjectType = getAuthSubjectType(req.payload)
    const sessionUser = await authService.buildSessionUser({
        userId,
        subjectType,
    })

    if (!sessionUser) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
    }

    return ApiResponse.success(res, sessionUser)
})

export const handleChangePassword = catchAsync(
    async (req: TypedRequest<ChangePasswordData>, res: Response) => {
        const userId = req.payload?.userId
        const subjectType = getAuthSubjectType(req.payload)

        if (!userId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Unauthorized')
        }

        if (subjectType === 'student') {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Student accounts cannot change password from this endpoint'
            )
        }

        if (subjectType === 'manager') {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Manager accounts cannot change password from this endpoint'
            )
        }

        await authService.changePassword(
            userId,
            req.body as unknown as ChangePasswordData
        )

        return ApiResponse.success(res, null, 'Password changed successfully')
    }
)
