import {
    ManagerAccount,
    ManagerAccountStatus,
    ManagerRoleType,
    Student,
    StudentAccountStatus,
    User,
    type Club,
    type Faculty,
} from '@prisma/client'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { config } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'
import * as authRepository from './auth.repository'
import {
    AuthSubjectType,
    AuthTokenPayload,
    ChangePasswordData,
    DashboardType,
    SessionRole,
    SessionUser,
    UserSignUpCredentials,
} from './types'

type StudentWithFaculty = Student & {
    faculty: Faculty
}

type ManagerWithContext = ManagerAccount & {
    faculty: Faculty | null
    club: Club | null
}

type ManagerScope = {
    dashboardType: DashboardType
    scopeName: string
}

const STUDENT_ACCOUNT_LOCKED_MESSAGE = 'Student account is locked'
const STUDENT_ACCOUNT_UNAVAILABLE_MESSAGE = 'Student account is unavailable'
const MANAGER_ACCOUNT_LOCKED_MESSAGE = 'Manager account is locked'
const MANAGER_ACCOUNT_UNAVAILABLE_MESSAGE = 'Manager account is unavailable'
const MANAGER_CONTEXT_INVALID_MESSAGE = 'Manager account context is invalid'
const MANAGER_INVALID_CREDENTIALS_MESSAGE = 'Invalid manager credentials'
const ERR_INVALID_MANAGER_CREDENTIALS = 'ERR_INVALID_MANAGER_CREDENTIALS'
const ERR_MANAGER_ACCOUNT_LOCKED = 'ERR_MANAGER_ACCOUNT_LOCKED'
const ERR_MANAGER_ACCOUNT_UNAVAILABLE = 'ERR_MANAGER_ACCOUNT_UNAVAILABLE'
const ERR_MANAGER_CONTEXT_INVALID = 'ERR_MANAGER_CONTEXT_INVALID'

const mapUserToSessionUser = (user: User): SessionUser => ({
    id: user.id,
    username: user.name,
    email: user.email ?? '',
    firstName: user.firstName ?? user.name,
    lastName: user.lastName ?? '',
    role: user.role,
    accountType: 'user',
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
    createdAt: user.createdAt,
})

const splitFullName = (fullName: string) => {
    const trimmed = fullName.trim()

    if (!trimmed) {
        return {
            firstName: '',
            lastName: '',
        }
    }

    const parts = trimmed.split(/\s+/)
    return {
        firstName: parts[parts.length - 1] ?? trimmed,
        lastName: parts.slice(0, -1).join(' '),
    }
}

const createManagerAuthError = (
    statusCode: number,
    message: string,
    code: string
) =>
    new ApiError(statusCode, message, true, {
        code,
    })

const getManagerScope = (manager: ManagerWithContext): ManagerScope => {
    if (manager.roleType === ManagerRoleType.CLB_MANAGER) {
        if (!manager.clubId || !manager.club) {
            throw createManagerAuthError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                MANAGER_CONTEXT_INVALID_MESSAGE,
                ERR_MANAGER_CONTEXT_INVALID
            )
        }

        return {
            dashboardType: 'club',
            scopeName: manager.club.name,
        }
    }

    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        if (!manager.facultyId || !manager.faculty) {
            throw createManagerAuthError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                MANAGER_CONTEXT_INVALID_MESSAGE,
                ERR_MANAGER_CONTEXT_INVALID
            )
        }

        return {
            dashboardType: 'faculty',
            scopeName: manager.faculty.name,
        }
    }

    return {
        dashboardType: 'school',
        scopeName: 'Doan truong',
    }
}

const buildManagerDisplayName = (
    manager: ManagerWithContext,
    scope: ManagerScope
) => {
    switch (manager.roleType) {
        case ManagerRoleType.CLB_MANAGER:
            return `Ban chu nhiem ${scope.scopeName}`
        case ManagerRoleType.LCD_MANAGER:
            return `BCH LCD ${scope.scopeName}`
        case ManagerRoleType.DOANTRUONG_ADMIN:
        default:
            return 'Doan truong'
    }
}

const mapStudentToSessionUser = (
    student: StudentWithFaculty
): SessionUser => {
    const { firstName, lastName } = splitFullName(student.fullName)

    return {
        id: student.id,
        username: student.mssv,
        email: student.email,
        firstName,
        lastName,
        role: 'STUDENT',
        accountType: 'student',
        fullName: student.fullName,
        mssv: student.mssv,
        className: student.className,
        facultyName: student.faculty.name,
        facultyCode: student.faculty.code,
        status: student.status,
        createdAt: student.createdAt,
    }
}

const mapManagerToSessionUser = (
    manager: ManagerWithContext
): SessionUser => {
    const scope = getManagerScope(manager)
    const displayName = buildManagerDisplayName(manager, scope)
    const { firstName, lastName } = splitFullName(displayName)

    return {
        id: manager.id,
        username: manager.username,
        email: manager.email,
        firstName,
        lastName,
        role: 'ADMIN',
        accountType: 'manager',
        fullName: displayName,
        roleType: manager.roleType,
        dashboardType: scope.dashboardType,
        scopeName: scope.scopeName,
        facultyId: manager.facultyId ?? null,
        facultyName: manager.faculty?.name ?? null,
        facultyCode: manager.faculty?.code ?? null,
        clubId: manager.clubId ?? null,
        clubName: manager.club?.name ?? null,
        status: manager.status,
        createdAt: manager.createdAt,
    }
}

const createAuthPayload = (
    userId: string,
    role: SessionRole,
    subjectType: AuthSubjectType
): AuthTokenPayload => ({
    userId,
    role,
    subjectType,
})

export const createUser = async (data: UserSignUpCredentials) => {
    const existingUser = await authRepository.getUserByEmail(data.email)
    if (existingUser) {
        throw new ApiError(HttpStatus.CONFLICT, 'Email already exists')
    }

    const hashedPassword = await argon2.hash(data.password)
    const newUser = await authRepository.createUser(data, hashedPassword)

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)

    await authRepository.createEmailVerificationToken(
        newUser.id,
        token,
        expiresAt
    )

    sendVerifyEmail(data.email, token)
    return newUser
}

export const changePassword = async (
    userId: string,
    data: ChangePasswordData
) => {
    const user = await authRepository.getUserById(userId)
    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'User not found')
    }

    const isPasswordValid = await argon2.verify(user.password, data.oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid old password')
    }

    const hashedPassword = await argon2.hash(data.newPassword)
    await authRepository.updatePassword(userId, hashedPassword)
}

export const getUserByEmail = async (email: string) => {
    return authRepository.getUserByEmail(email)
}

export const getUserByUsername = async (username: string) => {
    return authRepository.getUserByUsername(username)
}

export const getUserById = async (userId: string) => {
    return authRepository.getUserById(userId)
}

export const getStudentByMssv = async (mssv: string) => {
    return authRepository.getStudentByMssv(mssv)
}

export const getStudentById = async (studentId: string) => {
    return authRepository.getStudentById(studentId)
}

export const getManagerByIdentifier = async (identifier: string) => {
    return authRepository.getManagerByIdentifier(identifier)
}

export const getManagerById = async (managerId: string) => {
    return authRepository.getManagerById(managerId)
}

export const ensureStudentActive = (student: Student) => {
    if (student.status === StudentAccountStatus.ACTIVE) {
        return student
    }

    if (student.status === StudentAccountStatus.LOCKED) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            STUDENT_ACCOUNT_LOCKED_MESSAGE
        )
    }

    throw new ApiError(
        HttpStatus.FORBIDDEN,
        STUDENT_ACCOUNT_UNAVAILABLE_MESSAGE
    )
}

export const verifyStudentPassword = (student: Student, password: string) => {
    if (password !== student.mssv) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid username or password')
    }

    return true
}

export const ensureManagerActive = (manager: ManagerAccount) => {
    if (manager.status === ManagerAccountStatus.ACTIVE) {
        return manager
    }

    if (manager.status === ManagerAccountStatus.LOCKED) {
        throw createManagerAuthError(
            HttpStatus.FORBIDDEN,
            MANAGER_ACCOUNT_LOCKED_MESSAGE,
            ERR_MANAGER_ACCOUNT_LOCKED
        )
    }

    throw createManagerAuthError(
        HttpStatus.FORBIDDEN,
        MANAGER_ACCOUNT_UNAVAILABLE_MESSAGE,
        ERR_MANAGER_ACCOUNT_UNAVAILABLE
    )
}

export const ensureManagerContext = (manager: ManagerWithContext) => {
    return getManagerScope(manager)
}

export const verifyManagerPassword = async (
    manager: ManagerAccount,
    password: string
) => {
    const isPasswordValid = await bcrypt.compare(password, manager.passwordHash)

    if (!isPasswordValid) {
        throw createManagerAuthError(
            HttpStatus.UNAUTHORIZED,
            MANAGER_INVALID_CREDENTIALS_MESSAGE,
            ERR_INVALID_MANAGER_CREDENTIALS
        )
    }

    return true
}

export const getRefreshTokenByToken = async (token: string) => {
    return authRepository.getRefreshTokenByToken(token)
}

export const getStudentRefreshTokenByToken = async (token: string) => {
    return authRepository.getStudentRefreshTokenByToken(token)
}

export const deleteRefreshToken = async (token: string) => {
    return authRepository.deleteRefreshToken(token)
}

export const deleteStudentRefreshToken = async (token: string) => {
    return authRepository.deleteStudentRefreshToken(token)
}

export const deleteAllUserRefreshTokens = async (userId: string) => {
    return authRepository.deleteAllUserRefreshTokens(userId)
}

export const deleteAllStudentRefreshTokens = async (studentId: string) => {
    return authRepository.deleteAllStudentRefreshTokens(studentId)
}

export const buildSessionUser = async (
    payload: Pick<AuthTokenPayload, 'userId' | 'subjectType'>
) => {
    if (payload.subjectType === 'student') {
        const student = await getStudentById(payload.userId)
        return student ? mapStudentToSessionUser(student) : null
    }

    if (payload.subjectType === 'manager') {
        const manager = await getManagerById(payload.userId)
        return manager ? mapManagerToSessionUser(manager) : null
    }

    const user = await getUserById(payload.userId)
    return user ? mapUserToSessionUser(user) : null
}

export const createSession = async (userId: string, role: SessionRole) => {
    const payload = createAuthPayload(userId, role, 'user')
    const accessToken = createAccessToken(payload)
    const refreshToken = createRefreshToken(payload)

    await authRepository.createRefreshToken(userId, refreshToken)

    return { accessToken, refreshToken }
}

export const createStudentSession = async (studentId: string) => {
    const payload = createAuthPayload(studentId, 'STUDENT', 'student')
    const accessToken = createAccessToken(payload)
    const refreshToken = createRefreshToken(payload)

    await authRepository.createStudentRefreshToken(studentId, refreshToken)

    return { accessToken, refreshToken }
}

export const createManagerSession = async (manager: ManagerWithContext) => {
    ensureManagerContext(manager)

    const payload: AuthTokenPayload = {
        userId: manager.id,
        role: 'ADMIN',
        subjectType: 'manager',
        roleType: manager.roleType,
        facultyId: manager.facultyId ?? null,
        clubId: manager.clubId ?? null,
    }
    const accessToken = createAccessToken(payload)
    const refreshToken = createRefreshToken(payload)

    return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ;(jwt as any).verify(token, secret, (err: any, payload: any) => {
            if (err) {
                return reject(
                    new ApiError(HttpStatus.FORBIDDEN, 'Invalid token')
                )
            }

            resolve(payload)
        })
    })
}
