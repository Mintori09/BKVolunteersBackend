import { HttpStatus } from 'src/common/constants'
import {
    LoginInput,
    LoginOutput,
    ChangePasswordInput,
    UpdateProfileInput,
    MeOutput,
    AuthUser,
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

const mapPublicUser = (user: AuthUser): MeOutput => {
    if (user.role === 'SINHVIEN') {
        return {
            id: user.id,
            username: user.username,
            mssv: user.mssv || user.username,
            fullName: user.fullName || `${user.lastName} ${user.firstName}`.trim(),
            email: user.email,
            role: user.role,
            accountType: 'STUDENT',
            facultyId: user.facultyId,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            className: user.className ?? null,
            phone: user.phone ?? null,
            totalPoints: user.totalPoints ?? 0,
            facultyName: user.facultyName ?? null,
            lastLoginAt: user.lastLoginAt ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accountType: 'OPERATOR',
        facultyId: user.facultyId,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        facultyName: user.facultyName ?? null,
        managedClubName: user.managedClubName ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

export const handleLogin = catchAsync(
    async (req: TypedRequest<LoginInput>, res: Response) => {
        const cookies = req.cookies
        const { username, password } = req.body

        if (!username || !password) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Identifier va mat khau la bat buoc'
            )
        }

        const user = await authService.getUserbyUsernameOrMssv(username)

        if (!user) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Identifier hoac mat khau khong hop le'
            )
        }

        if (user.status !== 'ACTIVE') {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Tai khoan da bi khoa hoac vo hieu hoa'
            )
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, password)

        if (!isPasswordValid) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Identifier hoac mat khau khong hop le'
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

        await authService.updateLastLoginAt(user.id)

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            refreshToken,
            refreshTokenCookieConfig
        )

        return ApiResponse.success<LoginOutput>(res, {
            accessToken,
            refreshToken,
            user: mapPublicUser(user),
        })
    }
)

export const handleLogout = catchAsync(async (req: Request, res: Response) => {
    const cookies = req.cookies
    const refreshTokenFromBody =
        typeof req.body?.refresh_token === 'string'
            ? req.body.refresh_token
            : typeof req.body?.refreshToken === 'string'
              ? req.body.refreshToken
              : undefined

    const refreshToken =
        req.cookies[config.jwt.refresh_token.cookie_name] ?? refreshTokenFromBody

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

export const handleRefresh = catchAsync(async (req: Request, res: Response) => {
    const refreshTokenFromCookie: string | undefined =
        req.cookies[config.jwt.refresh_token.cookie_name]
    const refreshTokenFromBody =
        typeof req.body?.refresh_token === 'string'
            ? req.body.refresh_token
            : typeof req.body?.refreshToken === 'string'
              ? req.body.refreshToken
              : undefined
    const refreshToken = refreshTokenFromCookie ?? refreshTokenFromBody

    if (!refreshToken) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Khong tim thay refresh token')
    }

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
        } catch {
            // ignore
        }
        throw new ApiError(HttpStatus.FORBIDDEN, 'Refresh token khong hop le')
    }

    await authService.deleteRefreshToken(refreshToken)

    const payload = await authService.verifyToken(
        refreshToken,
        config.jwt.refresh_token.secret
    )

    if (foundRefreshToken.userId !== payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Refresh token khong khop user')
    }

    const user = await authService.getUserById(payload.userId, payload.role)

    if (!user || user.status !== 'ACTIVE') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Nguoi dung khong hop le')
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
        user: mapPublicUser(user),
    })
})

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.payload?.userId
    const role = req.payload?.role

    if (!userId || !role) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const user = await authService.getUserById(userId, role)

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay nguoi dung')
    }

    return ApiResponse.success<MeOutput>(res, mapPublicUser(user))
})

export const handleChangePassword = catchAsync(
    async (req: TypedRequest<ChangePasswordInput>, res: Response) => {
        const userId = req.payload?.userId
        const role = req.payload?.role

        if (!userId || !role) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        await authService.changePassword(
            userId,
            role,
            req.body as ChangePasswordInput
        )

        return ApiResponse.success(res, null, 'Doi mat khau thanh cong')
    }
)

export const updateMe = catchAsync(
    async (req: TypedRequest<UpdateProfileInput>, res: Response) => {
        const userId = req.payload?.userId
        const role = req.payload?.role

        if (!userId || !role) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        const updatedUser = await authService.updateProfile(
            userId,
            role,
            req.body as UpdateProfileInput
        )

        return ApiResponse.success(
            res,
            mapPublicUser(updatedUser),
            'Cap nhat ho so thanh cong'
        )
    }
)
