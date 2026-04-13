import {
    ManagerAccountStatus,
    ManagerRoleType,
    StudentAccountStatus,
    UserRole,
} from '@prisma/client'

export interface UserSignUpCredentials {
    firstName: string
    lastName: string
    username: string
    email: string
    password: string
    passwordConfirmed: string
}

export interface UserLoginCredentials {
    username: string
    password: string
}

export interface ManagerLoginCredentials {
    identifier: string
    password: string
}

export interface ChangePasswordData {
    oldPassword: string
    newPassword: string
    newPasswordConfirm: string
}

export type AuthSubjectType = 'user' | 'student' | 'manager'
export type SessionRole = UserRole | 'STUDENT'
export type DashboardType = 'club' | 'faculty' | 'school'

export interface AuthTokenPayload {
    userId: string
    role: SessionRole
    subjectType: AuthSubjectType
    roleType?: ManagerRoleType
    facultyId?: number | null
    clubId?: string | null
}

export interface SessionUser {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    role: SessionRole
    accountType: AuthSubjectType
    fullName?: string
    mssv?: string
    className?: string | null
    facultyName?: string | null
    facultyCode?: string | null
    facultyId?: number | null
    clubId?: string | null
    clubName?: string | null
    scopeName?: string | null
    dashboardType?: DashboardType
    roleType?: ManagerRoleType
    status?: StudentAccountStatus | ManagerAccountStatus
    createdAt: Date
}
