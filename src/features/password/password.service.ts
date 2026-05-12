import * as crypto from 'crypto'
import * as argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { config } from 'src/config'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import * as passwordRepository from './password.repository'
import { sendResetCodeEmail } from 'src/utils/sendEmail.util'
import * as authRepository from 'src/features/auth/auth.repository'

const RESET_CODE_LENGTH = 6
const RESET_CODE_EXPIRY_MINUTES = 10
const RESET_TOKEN_EXPIRY = '5m'

const generateResetCode = (): string => {
    const digits = '0123456789'
    let code = ''
    for (let i = 0; i < RESET_CODE_LENGTH; i++) {
        code += digits[crypto.randomInt(0, digits.length)]
    }
    return code
}

export const getResetTokenSecret = (): string => {
    return config.jwt.access_token.secret + ':password-reset'
}

export const forgotPassword = async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase().trim()

    const student = await authRepository.getUserByStudentEmail(normalizedEmail)
    const operator = await authRepository.getUserByEmail(normalizedEmail)
    if (!student && !operator) {
        return
    }

    const code = generateResetCode()
    const codeHash = await argon2.hash(code)
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000)
    await passwordRepository.createResetToken(normalizedEmail, codeHash, expiresAt)
    sendResetCodeEmail(normalizedEmail, code)
}

export const verifyCode = async (
    email: string,
    code: string,
): Promise<string> => {
    const normalizedEmail = email.toLowerCase().trim()

    const token = await passwordRepository.findLatestValidToken(normalizedEmail)
    if (!token) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Mã xác thực không hợp lệ hoặc đã hết hạn',
        )
    }

    const isValid = await argon2.verify(token.codeHash, code)
    if (!isValid) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Mã xác thực không chính xác',
        )
    }

    await passwordRepository.markTokenAsUsed(token.id)

    const resetToken = jwt.sign(
        { email: normalizedEmail, purpose: 'password-reset' },
        getResetTokenSecret(),
        { expiresIn: RESET_TOKEN_EXPIRY },
    )

    return resetToken
}

export const resetPassword = async (
    resetToken: string,
    newPassword: string,
): Promise<void> => {
    let payload: { email: string; purpose: string }
    try {
        const decoded = jwt.verify(resetToken, getResetTokenSecret())
        payload = decoded as unknown as { email: string; purpose: string }
    } catch {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Token không hợp lệ hoặc đã hết hạn',
        )
    }

    if (payload.purpose !== 'password-reset') {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Token không hợp lệ')
    }

    const email = payload.email
    const hashedPassword = await argon2.hash(newPassword)

    const student = await authRepository.getUserByStudentEmail(email)
    if (student) {
        await authRepository.updatePassword(
            student.id.toString(),
            hashedPassword,
            'STUDENT' as any,
        )
    } else {
        const operator = await authRepository.getUserByEmail(email)
        if (!operator) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Tài khoản không tồn tại',
            )
        }
        await authRepository.updatePassword(
            operator.id.toString(),
            hashedPassword,
            'OPERATOR' as any,
        )
    }

    await passwordRepository.markAllTokensAsUsed(email)
}
