import { UserRole } from 'src/common/types'
export type { UserRole }

// ============================================
// INPUT TYPES (Request Body)
// ============================================

export interface LoginInput {
    email: string
    password: string
}

export interface RefreshInput {
    refresh_token: string
}

export interface LogoutInput {
    refresh_token: string
}

export interface ChangePasswordInput {
    oldPassword: string
    newPassword: string
    newPasswordConfirm: string
}

// ============================================
// OUTPUT TYPES (Response Data)
// ============================================

export interface LoginOutput {
    accessToken: string
    refreshToken?: string
}

export interface MeOutput {
    account_type: 'STUDENT' | 'OPERATOR'
    role: UserRole
    organization: {
        id: number
        name: string
        type: string
    } | null
    faculty: {
        id: number
        code: string
        name: string
    } | null
    student?: {
        id: number
        student_code: string
        full_name: string
        email: string
        class_code: string | null
    }
    operator?: {
        id: number
        full_name: string
        email: string
    }
}

export interface ChangePasswordOutput {
    message: string
}
