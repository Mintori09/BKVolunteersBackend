import { HttpStatus } from 'src/common/constants'
import {
    LoginInput,
    LoginOutput,
    ChangePasswordInput,
    RefreshInput,
    LogoutInput,
    UserRole,
    MeOutput,
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
import * as microsoftAuth from './microsoft.auth'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const handleLogin = catchAsync(
    async (req: TypedRequest<LoginInput>, res: Response) => {
        const cookies = req.cookies
        const { identifier, password } = req.body

        if (!identifier || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Email/MSSV và mật khẩu là bắt buộc!'
            )
        }

        const user = await authService.getUserByIdentifier(identifier)

        if (!user) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Email/MSSV hoặc mật khẩu không hợp lệ'
            )
        }

        const isPasswordValid = await argon2.verify(user.password, password)

        if (!isPasswordValid) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Email hoặc mật khẩu không hợp lệ'
            )
        }

        const userRole: UserRole =
            'studentCode' in user ? 'STUDENT' : user.role

        if (cookies?.[config.jwt.refresh_token.cookie_name]) {
            const refreshToken = cookies[config.jwt.refresh_token.cookie_name]
            const checkRefreshToken =
                await authService.getRefreshTokenByToken(refreshToken)

            if (!checkRefreshToken) {
                await authService.deleteAllUserRefreshTokens(user.id, userRole)
            } else {
                const tokenId =
                    checkRefreshToken.userType === 'student'
                        ? checkRefreshToken.studentId
                        : checkRefreshToken.userId
                if (tokenId !== user.id) {
                    await authService.deleteAllUserRefreshTokens(
                        user.id,
                        userRole
                    )
                } else {
                    await authService.deleteRefreshToken(refreshToken, userRole)
                }
            }

            res.clearCookie(
                config.jwt.refresh_token.cookie_name,
                clearRefreshTokenCookieConfig
            )
        }

        const { accessToken, refreshToken } = await authService.createSession(
            user.id,
            userRole
        )

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            refreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success<LoginOutput>(res, { accessToken })
    }
)

export const handleLogout = catchAsync(async (req: TypedRequest<LogoutInput>, res: Response) => {
    const refreshToken =
        req.body.refresh_token ??
        req.cookies?.[config.jwt.refresh_token.cookie_name]

    if (!refreshToken) {
        return res.sendStatus(HttpStatus.NO_CONTENT)
    }

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

export const handleRefresh = catchAsync(async (req: TypedRequest<RefreshInput>, res: Response) => {
    const refreshToken: string | undefined =
        req.body.refresh_token ??
        req.cookies?.[config.jwt.refresh_token.cookie_name]

    if (!refreshToken)
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Không tìm thấy refresh token'
        )

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
            await authService.deleteAllUserRefreshTokens(
                payload.userId,
                payload.role
            )
        } catch {
            // Ignore verify errors here, just forbidden
        }
        throw new ApiError(HttpStatus.FORBIDDEN, 'Refresh token không hợp lệ')
    }

    await authService.deleteRefreshToken(refreshToken)

    try {
        const payload = await authService.verifyToken(
            refreshToken,
            config.jwt.refresh_token.secret
        )

        const tokenUserId =
            foundRefreshToken.userType === 'student'
                ? foundRefreshToken.studentId
                : foundRefreshToken.userId

        if (tokenUserId !== payload.userId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Không khớp người dùng')
        }

        const user = await authService.getUserByPrincipal(
            payload.userId,
            payload.accountType
        )

        if (!user) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Không tìm thấy người dùng'
            )
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await authService.createSession(payload.userId, payload.role)

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            newRefreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success<LoginOutput>(res, {
            accessToken,
            refreshToken: newRefreshToken,
        })
    } catch {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Refresh token không hợp lệ')
    }
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.payload?.userId
    const role = req.payload?.role
    const accountType = req.payload?.accountType

    if (!userId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng!')
    }

    if (!role || !accountType) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Thiếu principal!')
    }

    const user = await authService.getUserByPrincipal(userId, accountType)

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy người dùng!')
    }

    const anyUser = user as any
    const isStudent = 'studentCode' in anyUser

    return ApiResponse.success<MeOutput>(res, {
        account_type: accountType,
        role,
        organization: anyUser.organization
            ? {
                  id: Number(anyUser.organization.id),
                  name: anyUser.organization.name,
                  type: anyUser.organization.type,
              }
            : null,
        faculty: anyUser.faculty
            ? {
                  id: Number(anyUser.faculty.id),
                  code: anyUser.faculty.code,
                  name: anyUser.faculty.name,
              }
            : null,
        student: isStudent
            ? {
                  id: Number(anyUser.id),
                  student_code: anyUser.studentCode,
                  full_name: anyUser.fullName,
                  email: anyUser.email,
                  class_code: anyUser.classCode,
              }
            : undefined,
        operator: !isStudent
            ? {
                  id: Number(anyUser.id),
                  full_name: anyUser.fullName,
                  email: anyUser.email,
              }
            : undefined,
    })
})

export const handleMicrosoftLogin = catchAsync(
    async (req: Request, res: Response) => {
        if (microsoftAuth.isMicrosoftEnabled()) {
            const state = microsoftAuth.generateState()
            const stateMaxAge = 10 * 60 * 1000
            res.cookie(microsoftAuth.STATE_COOKIE, state, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: stateMaxAge,
                path: '/',
            })
            const authUrl = microsoftAuth.getMicrosoftAuthUrl(state)
            return res.redirect(302, authUrl)
        }

        const frontendUrl = config.frontend.url
        return res.redirect(
            302,
            `${frontendUrl}/auth/microsoft/mock-login`,
        )
    },
)

export const handleMicrosoftCallback = catchAsync(
    async (req: Request, res: Response) => {
        const frontendUrl = config.frontend.url
        const { code, state, error: oauthError } = req.query as {
            code?: string
            state?: string
            error?: string
        }

        if (oauthError) {
            return res.redirect(
                302,
                `${frontendUrl}/auth/microsoft/callback?error=${encodeURIComponent(oauthError)}`,
            )
        }

        if (microsoftAuth.isMicrosoftEnabled()) {
            const storedState = req.cookies?.[microsoftAuth.STATE_COOKIE]
            res.clearCookie(microsoftAuth.STATE_COOKIE, { path: '/' })

            if (!code || !state || state !== storedState) {
                return res.redirect(
                    302,
                    `${frontendUrl}/auth/microsoft/callback?error=invalid_state`,
                )
            }

            const token = await microsoftAuth.getMicrosoftToken(code)
            const msUser = await microsoftAuth.getMicrosoftUser(
                token.accessToken,
            )
            const { accessToken, refreshToken } =
                await microsoftAuth.authorizeMicrosoftUser(msUser.email)

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                refreshToken,
                refreshTokenCookieConfig,
            )

            return res.redirect(
                302,
                `${frontendUrl}/auth/microsoft/callback?access_token=${accessToken}`,
            )
        }

        return res.redirect(
            302,
            `${frontendUrl}/auth/microsoft/callback?error=microsoft_not_configured`,
        )
    },
)

export const handleMicrosoftMockCallback = catchAsync(
    async (req: Request, res: Response) => {
        const frontendUrl = config.frontend.url
        const { email } = req.query as { email?: string }

        if (!email) {
            return res.redirect(
                302,
                `${frontendUrl}/auth/microsoft/callback?error=missing_email`,
            )
        }

        try {
            const { accessToken, refreshToken } =
                await microsoftAuth.authorizeMicrosoftUser(email)

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                refreshToken,
                refreshTokenCookieConfig,
            )

            return res.redirect(
                302,
                `${frontendUrl}/auth/microsoft/callback?access_token=${accessToken}`,
            )
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Microsoft login failed'
            return res.redirect(
                302,
                `${frontendUrl}/auth/microsoft/callback?error=${encodeURIComponent(message)}`,
            )
        }
    },
)

export const handleChangePassword = catchAsync(
    async (req: TypedRequest<ChangePasswordInput>, res: Response) => {
        const userId = req.payload?.userId
        const role = req.payload?.role

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        if (!role) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Không có role!')
        }

        await authService.changePassword(
            userId,
            role,
            req.body as ChangePasswordInput
        )

        return ApiResponse.success(res, null, 'Đổi mật khẩu thành công')
    }
)
