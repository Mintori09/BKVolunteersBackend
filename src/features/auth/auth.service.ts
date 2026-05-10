import * as argon2 from 'argon2'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import { ChangePasswordInput, UserRole } from './types'
import * as jwt from 'jsonwebtoken'
import * as authRepository from './auth.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { AccountType } from 'src/common/types/canonical.types'
export const getUserByEmail = async (email: string) => {
    const operator = await authRepository.getUserByEmail(email)
    if (operator) return operator

    return authRepository.getUserByStudentEmail(email)
}

export const changePassword = async (
    userId: string,
    role: UserRole,
    data: ChangePasswordInput
) => {
    const user = await authRepository.getUserById(userId, role)
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Tài khoản không tồn tại')
    }

    const isPasswordValid = await argon2.verify(user.password, data.oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Sai mật khẩu cũ')
    }

    const hashedPassword = await argon2.hash(data.newPassword)
    await authRepository.updatePassword(userId, hashedPassword, role)
}

export const getUserById = async (userId: string, role: UserRole) => {
    return authRepository.getUserById(userId, role)
}

export const getUserByPrincipal = async (
    userId: string,
    accountType: AccountType
) => authRepository.getUserByPrincipal(userId, accountType)

export const getRefreshTokenByToken = async (token: string) => {
    return authRepository.getRefreshTokenByToken(token)
}

export const deleteRefreshToken = async (token: string, role?: UserRole) => {
    return authRepository.deleteRefreshToken(token, role)
}

export const deleteAllUserRefreshTokens = async (
    userId: string,
    role: UserRole
) => {
    return authRepository.deleteAllUserRefreshTokens(userId, role)
}

export const createSession = async (userId: string, role: UserRole) => {
    const accountType: AccountType = role === 'SINHVIEN' ? 'STUDENT' : 'OPERATOR'
    const user = await authRepository.getUserByPrincipal(userId, accountType)
    const facultyId =
        user && 'facultyId' in user ? (user.facultyId ?? null) : null
    const organizationId =
        user && 'organizationId' in user ? (user.organizationId ?? null) : null

    const accessToken = createAccessToken(
        userId,
        accountType,
        role,
        organizationId,
        facultyId
    )
    const refreshToken = createRefreshToken(userId, accountType, role)

    await authRepository.createRefreshToken(userId, refreshToken, role)

    return { accessToken, refreshToken }
}

export const verifyToken = (
    token: string,
    secret: string
): Promise<jwt.JwtPayload> => {
    return new Promise((resolve, reject) => {
        ;(jwt as any).verify(token, secret, (err: any, payload: any) => {
            if (err)
                return reject(
                    new ApiError(HttpStatus.FORBIDDEN, 'Token không hợp lệ')
                )
            resolve(payload as jwt.JwtPayload)
        })
    })
}
