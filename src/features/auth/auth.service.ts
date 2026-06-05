import * as argon2 from 'argon2'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import {
    AuthUser,
    ChangePasswordInput,
    UpdateProfileInput,
    UserRole,
} from './types'
import * as jwt from 'jsonwebtoken'
import * as authRepository from './auth.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { isMssv } from './utils'

export const getUserbyUsernameOrMssv = async (
    identifier: string
): Promise<AuthUser | null> => {
    if (isMssv(identifier)) {
        return authRepository.getUserByMssv(identifier)
    }
    if (identifier.includes('@')) {
        return authRepository.getUserByEmail(identifier)
    }
    return authRepository.getUserByUsername(identifier)
}

export const changePassword = async (
    userId: string,
    _role: UserRole,
    data: ChangePasswordInput
) => {
    const user = await authRepository.getUserById(userId)
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Tài khoản không tồn tại')
    }

    const isPasswordValid = await argon2.verify(
        user.passwordHash,
        data.oldPassword
    )
    if (!isPasswordValid) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Sai mật khẩu cũ')
    }

    const hashedPassword = await argon2.hash(data.newPassword)
    await authRepository.updatePassword(userId, hashedPassword)
}

export const updateProfile = async (
    userId: string,
    role: UserRole,
    data: UpdateProfileInput
) => {
    const existingUser = await authRepository.getUserById(userId, role)

    if (!existingUser) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Tài khoản không tồn tại')
    }

    await authRepository.updateProfile(userId, role, data)

    const updatedUser = await authRepository.getUserById(userId, role)

    if (!updatedUser) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Không thể tải lại hồ sơ sau khi cập nhật'
        )
    }

    return updatedUser
}

export const getUserByEmail = async (email: string) => {
    return authRepository.getUserByEmail(email)
}

export const getUserById = async (userId: string, role?: UserRole) => {
    return authRepository.getUserById(userId, role)
}

export const getRefreshTokenByToken = async (token: string) => {
    return authRepository.getRefreshTokenByToken(token)
}

export const deleteRefreshToken = async (token: string, role?: UserRole) => {
    return authRepository.deleteRefreshToken(token, role)
}

export const deleteAllUserRefreshTokens = async (
    userId: string,
    role?: UserRole
) => {
    return authRepository.deleteAllUserRefreshTokens(userId, role)
}

export const createSession = async (userId: string, role: UserRole) => {
    const user = await authRepository.getUserById(userId, role)
    const facultyId = user?.facultyId ?? undefined

    const accessToken = createAccessToken(userId, role, facultyId)
    const refreshToken = createRefreshToken(userId, role)

    await authRepository.createRefreshToken(userId, refreshToken, role)

    return { accessToken, refreshToken }
}

export const updateLastLoginAt = async (userId: string) => {
    return authRepository.updateLastLoginAt(userId)
}

export const verifyToken = (
    token: string,
    secret: string
): Promise<jwt.JwtPayload> => {
    return new Promise((resolve, reject) => {
        ;(jwt as any).verify(token, secret, (err: any, payload: any) => {
            if (err) {
                return reject(
                    new ApiError(HttpStatus.FORBIDDEN, 'Token không hợp lệ')
                )
            }
            resolve(payload as jwt.JwtPayload)
        })
    })
}
