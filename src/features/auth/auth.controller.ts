import { HttpStatus } from 'src/common/constants'
import {
    ChangePasswordData,
    UserLoginCredentials,
    UserSignUpCredentials,
} from './types'
import { TypedRequest } from 'src/types/request'
import * as argon2 from 'argon2'
import { Response, Request } from 'express'
import {
    clearRefreshTokenCookieConfig,
    config,
    refreshTokenCookieConfig,
} from 'src/config'
import * as authService from './auth.service'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

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
        const cookies = req.cookies
        const { email, password } = req.body

        if (!email || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Email and password are required!'
            )
        }

        const user = await authService.getUserByEmail(email)

        if (!user) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Invalid email or password'
            )
        }

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
                'Invalid email or password'
            )
        }

        if (cookies?.[config.jwt.refresh_token.cookie_name]) {
            const refreshToken = cookies[config.jwt.refresh_token.cookie_name]
            const checkRefreshToken =
                await authService.getRefreshTokenByToken(refreshToken)

            if (!checkRefreshToken || checkRefreshToken.userId !== user.id) {
                await authService.deleteAllUserRefreshTokens(user.id)
            } else {
                await authService.deleteRefreshToken(refreshToken)
            }

            res.clearCookie(
                config.jwt.refresh_token.cookie_name,
                clearRefreshTokenCookieConfig
            )
        }

        const { accessToken, refreshToken } = await authService.createSession(
            user.id,
            user.role
        )

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            refreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success(res, { accessToken })
    }
)

export const handleLogout = catchAsync(async (req: Request, res: Response) => {
    const cookies = req.cookies

    if (!cookies[config.jwt.refresh_token.cookie_name]) {
        return res.sendStatus(HttpStatus.NO_CONTENT)
    }

    const refreshToken = cookies[config.jwt.refresh_token.cookie_name]
    const foundRft = await authService.getRefreshTokenByToken(refreshToken)

    if (!foundRft) {
        res.clearCookie(
            config.jwt.refresh_token.cookie_name,
            clearRefreshTokenCookieConfig
        )
        return res.sendStatus(HttpStatus.NO_CONTENT)
    }

    await authService.deleteRefreshToken(refreshToken)

    res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
    )

    return res.sendStatus(HttpStatus.NO_CONTENT)
})

export const handleRefresh = catchAsync(async (req: Request, res: Response) => {
    const refreshToken: string | undefined =
        req.cookies[config.jwt.refresh_token.cookie_name]

    if (!refreshToken)
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Refresh token not found')

    res.clearCookie(
        config.jwt.refresh_token.cookie_name,
        clearRefreshTokenCookieConfig
    )

    const foundRefreshToken =
        await authService.getRefreshTokenByToken(refreshToken)

    if (!foundRefreshToken) {
        try {
            const payload = await authService.verifyToken(
                refreshToken,
                config.jwt.refresh_token.secret
            )
            await authService.deleteAllUserRefreshTokens(payload.userId)
        } catch (err) {
            // Ignore verify errors here, just forbidden
        }
        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid refresh token')
    }

    await authService.deleteRefreshToken(refreshToken)

    try {
        const payload = await authService.verifyToken(
            refreshToken,
            config.jwt.refresh_token.secret
        )

        if (foundRefreshToken.userId !== payload.userId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'User mismatch')
        }

        const user = await authService.getUserById(payload.userId)

        if (!user) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'User not found')
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await authService.createSession(payload.userId, user.role)

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            newRefreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success(res, { accessToken })
    } catch (err) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid refresh token')
    }
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.payload?.userId

    if (!userId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Unauthorized')
    }

    const user = await authService.getUserById(userId)

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
    }

    const { password, ...userWithoutPassword } = user

    return ApiResponse.success(res, userWithoutPassword)
})

export const handleChangePassword = catchAsync(
    async (req: TypedRequest<ChangePasswordData>, res: Response) => {
        const userId = req.payload?.userId

        if (!userId) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Unauthorized')
        }

        await authService.changePassword(
            userId,
            req.body as unknown as ChangePasswordData
        )

        return ApiResponse.success(res, null, 'Password changed successfully')
    }
)
