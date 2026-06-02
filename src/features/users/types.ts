import { UserAccountStatus } from '@prisma/client'
import { UserRole } from 'src/features/auth/types'

export interface UsersQueryInput {
    page?: number | string
    limit?: number | string
    search?: string
    role?: UserRole
    status?: UserAccountStatus
}

export interface CreateStudentUserInput {
    role: 'SINHVIEN'
    email: string
    password: string
    mssv: string
    fullName: string
    facultyId: number
    className?: string
    phone?: string
}

export interface CreateLcdUserInput {
    role: 'LCD'
    username: string
    email: string
    password: string
    facultyId: number
}

export interface CreateClbUserInput {
    role: 'CLB'
    username: string
    email: string
    password: string
    facultyId?: number
    managedClubId?: string
}

export interface CreateDoanTruongUserInput {
    role: 'DOANTRUONG'
    username: string
    email: string
    password: string
}

export type CreateUserInput =
    | CreateStudentUserInput
    | CreateLcdUserInput
    | CreateClbUserInput
    | CreateDoanTruongUserInput

export interface UpdateStudentUserInput {
    role: 'SINHVIEN'
    email: string
    password?: string
    mssv: string
    fullName: string
    facultyId: number
    className?: string
    phone?: string
}

export interface UpdateLcdUserInput {
    role: 'LCD'
    username: string
    email: string
    password?: string
    facultyId: number
}

export interface UpdateClbUserInput {
    role: 'CLB'
    username: string
    email: string
    password?: string
    facultyId?: number
    managedClubId?: string
}

export interface UpdateDoanTruongUserInput {
    role: 'DOANTRUONG'
    username: string
    email: string
    password?: string
}

export type UpdateUserInput =
    | UpdateStudentUserInput
    | UpdateLcdUserInput
    | UpdateClbUserInput
    | UpdateDoanTruongUserInput

export interface UpdateUserStatusInput {
    status: 'ACTIVE' | 'LOCKED'
}

export interface FacultyOption {
    id: number
    code: string
    name: string
}

export interface ClubOption {
    id: string
    name: string
    facultyId: number | null
    isSchoolLevel: boolean
}

export interface UserManagementItem {
    id: string
    username: string
    email: string
    role: UserRole
    status: UserAccountStatus
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    facultyId: number | null
    facultyName: string | null
    managedClubId: string | null
    managedClubName: string | null
    mssv: string | null
    fullName: string | null
    className: string | null
    phone: string | null
}

export interface UserListOutput {
    data: UserManagementItem[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface UserOptionsOutput {
    faculties: FacultyOption[]
    clubs: ClubOption[]
}
