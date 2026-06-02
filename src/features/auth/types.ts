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
    user: MeOutput
}

export interface UserMeOutput {
    id: string
    username: string
    email: string
    role: UserRole
    facultyId: number | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    createdAt: Date
    updatedAt: Date
}

export interface StudentMeOutput {
    id: string
    username: string
    mssv: string
    fullName: string
    email: string
    role: UserRole
    facultyId: number | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    className: string | null
    phone: string | null
    totalPoints: number
    createdAt: Date
    updatedAt: Date
}

export type MeOutput = UserMeOutput | StudentMeOutput

export interface AuthUser {
    id: string
    username: string
    email: string
    role: UserRole
    facultyId: number | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    createdAt: Date
    updatedAt: Date
    passwordHash: string
    mssv?: string
    fullName?: string
    className?: string | null
    phone?: string | null
    totalPoints?: number
}

export interface ChangePasswordOutput {
    message: string
}
