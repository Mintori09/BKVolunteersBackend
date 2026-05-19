export interface ForgotPasswordInput {
    email: string
}

export interface VerifyCodeInput {
    email: string
    code: string
}

export interface VerifyCodeOutput {
    resetToken: string
}

export interface ResetPasswordInput {
    resetToken: string
    newPassword: string
    newPasswordConfirm: string
}

export interface PasswordResetTokenRow {
    id: bigint
    email: string
    codeHash: string
    expiresAt: Date
    usedAt: Date | null
    createdAt: Date
    updatedAt: Date
}
