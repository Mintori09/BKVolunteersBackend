// ============================================
// SHARED TYPES
// ============================================

export type UserRole = 'CLB' | 'LCD' | 'DOANTRUONG' | 'SINHVIEN'

// ============================================
// INPUT TYPES (Request Body)
// ============================================

export interface LoginInput {
    username: string
    password: string
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
}

export interface UserMeOutput {
    id: string
    username: string
    email: string
    role: Exclude<UserRole, 'SINHVIEN'>
    facultyId: number | null
    emailVerified: Date | null
    createdAt: Date
    updatedAt: Date
}

export interface StudentMeOutput {
    id: string
    mssv: string
    fullName: string
    email: string
    facultyId: number
    className: string | null
    phone: string | null
    totalPoints: number
    createdAt: Date
    updatedAt: Date
}

export type MeOutput = UserMeOutput | StudentMeOutput

export interface ChangePasswordOutput {
    message: string
}
