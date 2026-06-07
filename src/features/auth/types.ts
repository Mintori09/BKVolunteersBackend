// ============================================
// SHARED TYPES
// ============================================

export type UserRole = 'CLB' | 'LCD' | 'DOANTRUONG' | 'SINHVIEN'
export type AccountType = 'STUDENT' | 'OPERATOR'

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

export interface UpdateProfileInput {
    email: string
    fullName?: string
    phone?: string
}

// ============================================
// OUTPUT TYPES (Response Data)
// ============================================

export interface LoginOutput {
    accessToken: string
    refreshToken?: string | null
    user: MeOutput
}

export interface UserMeOutput {
    id: string
    username: string
    email: string
    role: UserRole
    accountType: AccountType
    avatarFileId: string | null
    managerAccountId: string | null
    facultyId: number | null
    managedClubId: string | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    facultyName?: string | null
    managedClubName?: string | null
    lastLoginAt?: Date | null
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
    accountType: AccountType
    avatarFileId: string | null
    studentProfileId: string | null
    facultyId: number | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    className: string | null
    phone: string | null
    totalPoints: number
    facultyName?: string | null
    lastLoginAt?: Date | null
    createdAt: Date
    updatedAt: Date
}

export type MeOutput = UserMeOutput | StudentMeOutput

export interface AuthUser {
    id: string
    username: string
    email: string
    role: UserRole
    accountType?: AccountType
    avatarFileId?: string | null
    studentProfileId?: string | null
    managerAccountId?: string | null
    facultyId: number | null
    managedClubId?: string | null
    firstName: string
    lastName: string
    status: 'ACTIVE' | 'LOCKED' | 'DISABLED'
    createdAt: Date
    updatedAt: Date
    passwordHash: string
    deletedAt?: Date | null
    lastLoginAt?: Date | null
    facultyName?: string | null
    managedClubName?: string | null
    mssv?: string
    fullName?: string
    className?: string | null
    phone?: string | null
    totalPoints?: number
}

export interface ChangePasswordOutput {
    message: string
}
