import { UserAccountStatus, type Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { AuthUser, UserRole } from './types'

type UserWithProfiles = Prisma.UserGetPayload<{
    include: {
        managerProfile: true
        studentProfile: true
    }
}>

type StudentWithUser = Prisma.StudentGetPayload<{
    include: {
        user: true
    }
}>

const splitName = (fullName: string) => {
    const normalized = fullName.trim()
    if (!normalized) {
        return { firstName: '', lastName: '' }
    }
    const parts = normalized.split(/\s+/)
    const lastName = parts.shift() || ''
    const firstName = parts.join(' ')
    return { firstName, lastName }
}

const mapManagerUser = (user: UserWithProfiles): AuthUser | null => {
    const manager = user.managerProfile
    if (!manager) return null

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as UserRole,
        facultyId: manager.facultyId ?? null,
        firstName: user.username,
        lastName: '',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        passwordHash: user.passwordHash,
    }
}

const mapStudentUser = (
    user: Pick<
        UserWithProfiles,
        'id' | 'email' | 'status' | 'createdAt' | 'updatedAt' | 'passwordHash'
    >,
    student: Pick<
        StudentWithUser,
        'mssv' | 'fullName' | 'facultyId' | 'className' | 'phone' | 'totalPoints'
    >
): AuthUser => {
    const { firstName, lastName } = splitName(student.fullName)
    return {
        id: user.id,
        username: student.mssv,
        email: user.email,
        role: 'SINHVIEN',
        facultyId: student.facultyId,
        firstName,
        lastName,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        passwordHash: user.passwordHash,
        mssv: student.mssv,
        fullName: student.fullName,
        className: student.className,
        phone: student.phone,
        totalPoints: student.totalPoints,
    }
}

const mapUserToAuthUser = (user: UserWithProfiles): AuthUser | null => {
    const student = user.studentProfile
    if (student) {
        return mapStudentUser(user, student)
    }
    return mapManagerUser(user)
}

export const getUserByEmail = async (email: string) => {
    const user = await prismaClient.user.findUnique({
        where: { email },
        include: {
            managerProfile: true,
            studentProfile: true,
        },
    })
    if (!user) return null
    return mapUserToAuthUser(user)
}

export const getUserByUsername = async (username: string) => {
    const user = await prismaClient.user.findUnique({
        where: { username },
        include: {
            managerProfile: true,
            studentProfile: true,
        },
    })
    if (!user) return null
    return mapUserToAuthUser(user)
}

export const getUserByMssv = async (mssv: string) => {
    const student = await prismaClient.student.findUnique({
        where: { mssv },
        include: { user: true },
    })

    if (!student) return null

    return mapStudentUser(student.user, student)
}

export const getUserById = async (userId: string, role?: UserRole) => {
    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
            managerProfile: true,
            studentProfile: true,
        },
    })
    if (!user) return null

    const mappedUser = mapUserToAuthUser(user)
    if (!mappedUser) return null

    if (role && mappedUser.role !== role) {
        return null
    }

    return mappedUser
}

export const getRefreshTokenByToken = async (token: string) => {
    const refreshToken = await prismaClient.userRefreshToken.findUnique({
        where: { token },
    })
    if (!refreshToken) return null

    return { ...refreshToken, userType: 'user' as const }
}

export const deleteRefreshToken = async (token: string, _role?: UserRole) => {
    return prismaClient.userRefreshToken.deleteMany({ where: { token } })
}

export const deleteAllUserRefreshTokens = async (
    userId: string,
    _role?: UserRole
) => {
    return prismaClient.userRefreshToken.deleteMany({ where: { userId } })
}

export const createRefreshToken = async (
    userId: string,
    token: string,
    _role?: UserRole
) => {
    return prismaClient.userRefreshToken.create({
        data: {
            token,
            userId,
        },
    })
}

export const updatePassword = async (
    userId: string,
    hashedPassword: string,
    _role?: UserRole
) => {
    return prismaClient.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
    })
}

export const updateLastLoginAt = async (userId: string) => {
    return prismaClient.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
    })
}

export const isUserActive = (status: UserAccountStatus): boolean =>
    status === 'ACTIVE'
