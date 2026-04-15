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
import { isMssv } from './utils'

export const getUserbyUsernameOrMssv = async (username: string) => {
    const isMssvFlag: boolean = isMssv(username)
    if (isMssvFlag) {
        return authRepository.getUserByMssv(username)
    } else {
        return authRepository.getUserByUsername(username)
    }
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

export const getUserByEmail = async (email: string) => {
    return authRepository.getUserByEmail(email)
}

export const getUserById = async (userId: string, role: UserRole) => {
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
    role: UserRole
) => {
    return authRepository.deleteAllUserRefreshTokens(userId, role)
}

export const createSession = async (userId: string, role: UserRole) => {
    let facultyId: string | number | null | undefined = undefined

    if (role === 'SINHVIEN') {
        const student = await authRepository.getUserById(userId, role)
        if (student && 'mssv' in student) {
            facultyId =
                (student as { facultyId: string | null }).facultyId ?? null
        }
    } else {
        const user = await authRepository.getUserById(userId, role)
        if (user && 'facultyId' in user) {
            facultyId = (user as { facultyId: number | null }).facultyId ?? null
        }
    }

    const accessToken = createAccessToken(userId, role, facultyId)
    const refreshToken = createRefreshToken(userId)

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
