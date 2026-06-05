import { UserAccountStatus, type Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { AuthUser, UpdateProfileInput, UserRole } from './types'

type UserWithProfiles = Prisma.UserGetPayload<{
    include: {
        managerProfile: {
            include: {
                faculty: true
                managedClub: true
            }
        }
        studentProfile: {
            include: {
                faculty: true
            }
        }
    }
}>

type StudentWithUser = Prisma.StudentGetPayload<{
    include: {
        user: true
        faculty: true
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
        lastLoginAt: user.lastLoginAt,
        facultyName: manager.faculty?.name ?? null,
        managedClubName: manager.managedClub?.name ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        passwordHash: user.passwordHash,
    }
}

const mapStudentUser = (
    user: Pick<
        UserWithProfiles,
        | 'id'
        | 'email'
        | 'status'
        | 'lastLoginAt'
        | 'createdAt'
        | 'updatedAt'
        | 'passwordHash'
    >,
    student: Pick<
        StudentWithUser,
        | 'mssv'
        | 'fullName'
        | 'facultyId'
        | 'className'
        | 'phone'
        | 'totalPoints'
        | 'faculty'
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
        lastLoginAt: user.lastLoginAt,
        facultyName: student.faculty?.name ?? null,
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
            managerProfile: {
                include: {
                    faculty: true,
                    managedClub: true,
                },
            },
            studentProfile: {
                include: {
                    faculty: true,
                },
            },
        },
    })
    if (!user) return null
    return mapUserToAuthUser(user)
}

export const getUserByUsername = async (username: string) => {
    const user = await prismaClient.user.findUnique({
        where: { username },
        include: {
            managerProfile: {
                include: {
                    faculty: true,
                    managedClub: true,
                },
            },
            studentProfile: {
                include: {
                    faculty: true,
                },
            },
        },
    })
    if (!user) return null
    return mapUserToAuthUser(user)
}

export const getUserByMssv = async (mssv: string) => {
    const student = await prismaClient.student.findUnique({
        where: { mssv },
        include: {
            user: true,
            faculty: true,
        },
    })

    if (!student) return null

    return mapStudentUser(student.user, student)
}

export const getUserById = async (userId: string, role?: UserRole) => {
    const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
            managerProfile: {
                include: {
                    faculty: true,
                    managedClub: true,
                },
            },
            studentProfile: {
                include: {
                    faculty: true,
                },
            },
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

const normalizeOptionalString = (value?: string | null) => {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

export const updateProfile = async (
    userId: string,
    role: UserRole,
    data: UpdateProfileInput
) => {
    return prismaClient.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                email: data.email.trim(),
            },
        })

        if (role === 'SINHVIEN') {
            await tx.student.update({
                where: { userId },
                data: {
                    ...(data.fullName?.trim()
                        ? { fullName: data.fullName.trim() }
                        : {}),
                    phone: normalizeOptionalString(data.phone),
                },
            })
        }
    })
}

export const isUserActive = (status: UserAccountStatus): boolean =>
    status === 'ACTIVE'
