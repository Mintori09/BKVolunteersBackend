// ============================================
// INPUT TYPES (Request Body)
// ============================================

export interface ForgotPasswordInput {
    email: string
}

export interface ResetPasswordInput {
    newPassword: string
}

export interface ResetPasswordParams {
    token: string
}

// ============================================
// OUTPUT TYPES (Response Data)
// ============================================

export interface ForgotPasswordOutput {
    message: string
}

export interface ResetPasswordOutput {
    message: string
}
