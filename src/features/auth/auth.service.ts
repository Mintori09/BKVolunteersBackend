import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import { ChangePasswordData, UserSignUpCredentials } from './types'
import * as jwt from 'jsonwebtoken'
import * as authRepository from './auth.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

export const createUser = async (data: UserSignUpCredentials) => {
    const existingUser = await authRepository.getUserByEmail(data.email)
    if (existingUser) {
        throw new ApiError(HttpStatus.CONFLICT, 'Email already exists')
    }

    const hashedPassword = await argon2.hash(data.password)
    const newUser = await authRepository.createUser(data, hashedPassword)

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)

    await authRepository.createEmailVerificationToken(
        newUser.id,
        token,
        expiresAt
    )

    sendVerifyEmail(data.email, token)
    return newUser
}

export const changePassword = async (
    userId: string,
    data: ChangePasswordData
) => {
    const user = await authRepository.getUserById(userId)
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
    }

    const isPasswordValid = await argon2.verify(user.password, data.oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid old password')
    }

    const hashedPassword = await argon2.hash(data.newPassword)
    await authRepository.updatePassword(userId, hashedPassword)
}

export const getUserByEmail = async (email: string) => {
    return authRepository.getUserByEmail(email)
}

export const getUserById = async (userId: string) => {
    return authRepository.getUserById(userId)
}

export const getRefreshTokenByToken = async (token: string) => {
    return authRepository.getRefreshTokenByToken(token)
}

export const deleteRefreshToken = async (token: string) => {
    return authRepository.deleteRefreshToken(token)
}

export const deleteAllUserRefreshTokens = async (userId: string) => {
    return authRepository.deleteAllUserRefreshTokens(userId)
}

export const createSession = async (userId: string, role: string) => {
    const accessToken = createAccessToken(userId, role)
    const refreshToken = createRefreshToken(userId)

    await authRepository.createRefreshToken(userId, refreshToken)

    return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ;(jwt as any).verify(token, secret, (err: any, payload: any) => {
            if (err)
                return reject(
                    new ApiError(HttpStatus.FORBIDDEN, 'Invalid token')
                )
            resolve(payload)
        })
    })
}
