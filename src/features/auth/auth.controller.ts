import { HttpStatus } from 'src/common/constants'
import {
    LoginInput,
    LoginOutput,
    ChangePasswordInput,
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
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const handleLogin = catchAsync(
    async (req: TypedRequest<LoginInput>, res: Response) => {
        const cookies = req.cookies
        const { username, password } = req.body

        if (!username || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Email và mật khẩu là bắt buộc!'
            )
        }

        const user = await authService.getUserbyUsernameOrMssv(username)

        if (!user) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Email hoặc mật khẩu không hợp lệ'
            )
        }

        const isPasswordValid = await argon2.verify(user.password, password)

        if (!isPasswordValid) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Email hoặc mật khẩu không hợp lệ'
            )
        }

        const userRole: UserRole = 'mssv' in user ? 'SINHVIEN' : user.role

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

        const user = await authService.getUserById(payload.userId, payload.role)

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

        return ApiResponse.success<LoginOutput>(res, { accessToken })
    } catch {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Refresh token không hợp lệ')
    }
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.payload?.userId
    const role = req.payload?.role

    if (!userId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng!')
    }

    if (!role) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Không có role!')
    }

    const user = await authService.getUserById(userId, role)

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy người dùng!')
    }

    const { password: _password, ...userWithoutPassword } = user

    return ApiResponse.success<MeOutput>(res, userWithoutPassword)
})

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
