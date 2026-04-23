import { UserRole } from 'src/features/auth/types'

export interface CreateUserInput {
    username: string
    email: string
    password: string
    role: Exclude<UserRole, 'SINHVIEN'>
    facultyId?: number
}

export interface UserActor {
    userId?: string
    role?: Exclude<UserRole, 'SINHVIEN'> | 'SINHVIEN'
}
