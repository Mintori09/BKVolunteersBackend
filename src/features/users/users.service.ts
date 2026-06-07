import * as argon2 from 'argon2'
import { Prisma, UserAccountStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { UserRole } from 'src/features/auth/types'
import { ApiError } from 'src/utils/ApiError'
import {
    ClubOption,
    CreateUserInput,
    FacultyOption,
    UpdateUserInput,
    UpdateUserStatusInput,
    UserListOutput,
    UserManagementItem,
    UserOptionsOutput,
    UsersQueryInput,
} from './types'

type ManagedRole = Exclude<UserRole, 'SINHVIEN'>

type UserWithRelations = Prisma.UserGetPayload<{
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

const isManagedRole = (role: UserRole): role is ManagedRole =>
    role !== 'SINHVIEN'

const normalizeOptionalString = (value?: string | null) => {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

const userManagementInclude = {
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
} satisfies Prisma.UserInclude

const mapUserItem = (user: UserWithRelations): UserManagementItem => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role as UserRole,
    status: user.status,
    avatarFileId: user.avatarFileId ?? null,
    studentProfileId: user.studentProfile?.id ?? null,
    managerAccountId: user.managerProfile?.id ?? null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt ?? null,
    facultyId:
        user.studentProfile?.facultyId ??
        user.managerProfile?.facultyId ??
        null,
    facultyName:
        user.studentProfile?.faculty.name ??
        user.managerProfile?.faculty?.name ??
        null,
    managedClubId: user.managerProfile?.managedClubId ?? null,
    managedClubName: user.managerProfile?.managedClub?.name ?? null,
    mssv: user.studentProfile?.mssv ?? null,
    fullName: user.studentProfile?.fullName ?? null,
    className: user.studentProfile?.className ?? null,
    phone: user.studentProfile?.phone ?? null,
    totalPoints: user.studentProfile?.totalPoints ?? null,
})

const loadUserManagementItem = async (
    userId: string,
    tx?: Prisma.TransactionClient
): Promise<UserManagementItem> => {
    const user = await (tx ?? prismaClient).user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
        include: userManagementInclude,
    })

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay tai khoan')
    }

    return mapUserItem(user)
}

const ensureFacultyExists = async (
    tx: Prisma.TransactionClient,
    facultyId: number
) => {
    const faculty = await tx.faculty.findUnique({ where: { id: facultyId } })
    if (!faculty) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay khoa')
    }
}

const ensureClubExists = async (
    tx: Prisma.TransactionClient,
    clubId: string
): Promise<number | null> => {
    const club = await tx.club.findFirst({
        where: {
            id: clubId,
            deletedAt: null,
        },
    })
    if (!club) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay CLB')
    }
    return club.facultyId
}

const ensureUniqueForCreate = async (
    tx: Prisma.TransactionClient,
    data: CreateUserInput
) => {
    const usernameToCheck = data.role === 'SINHVIEN' ? data.mssv : data.username
    const existingUser = await tx.user.findFirst({
        where: {
            OR: [{ username: usernameToCheck }, { email: data.email }],
            deletedAt: null,
        },
    })

    if (existingUser?.username === usernameToCheck) {
        throw new ApiError(HttpStatus.CONFLICT, 'Username da ton tai')
    }
    if (existingUser?.email === data.email) {
        throw new ApiError(HttpStatus.CONFLICT, 'Email da ton tai')
    }

    if (data.role === 'SINHVIEN') {
        const existingStudent = await tx.student.findFirst({
            where: {
                mssv: data.mssv,
                deletedAt: null,
            },
        })
        if (existingStudent) {
            throw new ApiError(HttpStatus.CONFLICT, 'MSSV da ton tai')
        }
    }
}

const ensureUniqueForUpdate = async (
    tx: Prisma.TransactionClient,
    userId: string,
    data: UpdateUserInput
) => {
    const usernameToCheck = data.role === 'SINHVIEN' ? data.mssv : data.username
    const existingUser = await tx.user.findFirst({
        where: {
            id: { not: userId },
            deletedAt: null,
            OR: [{ username: usernameToCheck }, { email: data.email }],
        },
    })

    if (existingUser?.username === usernameToCheck) {
        throw new ApiError(HttpStatus.CONFLICT, 'Username da ton tai')
    }
    if (existingUser?.email === data.email) {
        throw new ApiError(HttpStatus.CONFLICT, 'Email da ton tai')
    }

    if (data.role === 'SINHVIEN') {
        const existingStudent = await tx.student.findFirst({
            where: {
                mssv: data.mssv,
                deletedAt: null,
                userId: { not: userId },
            },
        })
        if (existingStudent) {
            throw new ApiError(HttpStatus.CONFLICT, 'MSSV da ton tai')
        }
    }
}

const getEditableUser = async (userId: string) => {
    const user = await prismaClient.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
        },
        include: {
            managerProfile: true,
            studentProfile: true,
        },
    })

    if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay tai khoan')
    }

    return user
}

export const listUsers = async (
    query: UsersQueryInput
): Promise<UserListOutput> => {
    const page = Math.max(Number(query.page) || 1, 1)
    const limit = Math.max(Number(query.limit) || 10, 1)
    const skip = (page - 1) * limit
    const search = query.search?.trim()

    const where: Prisma.UserWhereInput = {
        deletedAt: null,
        ...(query.role ? { role: query.role } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(search
            ? {
                  OR: [
                      { username: { contains: search } },
                      { email: { contains: search } },
                      {
                          studentProfile: {
                              is: {
                                  mssv: { contains: search },
                              },
                          },
                      },
                      {
                          studentProfile: {
                              is: {
                                  fullName: { contains: search },
                              },
                          },
                      },
                  ],
              }
            : {}),
    }

    const [users, total] = await Promise.all([
        prismaClient.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: userManagementInclude,
        }),
        prismaClient.user.count({ where }),
    ])

    return {
        data: users.map(mapUserItem),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const getUserOptions = async (): Promise<UserOptionsOutput> => {
    const [faculties, clubs] = await Promise.all([
        prismaClient.faculty.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                code: true,
                name: true,
            },
        }),
        prismaClient.club.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                facultyId: true,
                isSchoolLevel: true,
            },
        }),
    ])

    return {
        faculties: faculties as FacultyOption[],
        clubs: clubs as ClubOption[],
    }
}

export const createUser = async (data: CreateUserInput) => {
    return prismaClient.$transaction(async (tx) => {
        await ensureUniqueForCreate(tx, data)

        if (data.role === 'SINHVIEN') {
            await ensureFacultyExists(tx, data.facultyId)
        }
        if (data.role === 'LCD') {
            await ensureFacultyExists(tx, data.facultyId)
        }

        let facultyIdForManager: number | null = null
        if (data.role === 'CLB') {
            if (data.managedClubId) {
                facultyIdForManager = await ensureClubExists(
                    tx,
                    data.managedClubId
                )
            } else if (data.facultyId) {
                await ensureFacultyExists(tx, data.facultyId)
                facultyIdForManager = data.facultyId
            }
        }

        const passwordHash = await argon2.hash(data.password)

        if (data.role === 'SINHVIEN') {
            const createdUser = await tx.user.create({
                data: {
                    username: data.mssv,
                    email: data.email,
                    passwordHash,
                    role: 'SINHVIEN',
                    status: 'ACTIVE',
                    studentProfile: {
                        create: {
                            mssv: data.mssv,
                            fullName: data.fullName,
                            facultyId: data.facultyId,
                            className: normalizeOptionalString(data.className),
                            phone: normalizeOptionalString(data.phone),
                        },
                    },
                },
            })

            return loadUserManagementItem(createdUser.id, tx)
        }

        const createdUser = await tx.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash,
                role: data.role,
                status: 'ACTIVE',
                managerProfile: {
                    create: {
                        facultyId:
                            data.role === 'LCD'
                                ? data.facultyId
                                : facultyIdForManager,
                        managedClubId:
                            data.role === 'CLB'
                                ? (data.managedClubId ?? null)
                                : null,
                    },
                },
            },
        })

        return loadUserManagementItem(createdUser.id, tx)
    })
}

export const updateUser = async (userId: string, data: UpdateUserInput) => {
    const existingUser = await getEditableUser(userId)

    const wasManager = !!existingUser.managerProfile
    const willBeManager = isManagedRole(data.role)

    if (wasManager !== willBeManager) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Khong ho tro chuyen doi giua tai khoan sinh vien va quan ly'
        )
    }

    return prismaClient.$transaction(async (tx) => {
        await ensureUniqueForUpdate(tx, userId, data)

        const passwordHash = data.password
            ? await argon2.hash(data.password)
            : null

        if (data.role === 'SINHVIEN') {
            await ensureFacultyExists(tx, data.facultyId)

            await tx.user.update({
                where: { id: userId },
                data: {
                    username: data.mssv,
                    email: data.email,
                    role: 'SINHVIEN',
                    ...(passwordHash ? { passwordHash } : {}),
                },
            })

            if (!existingUser.studentProfile) {
                throw new ApiError(
                    HttpStatus.BAD_REQUEST,
                    'Khong tim thay ho so sinh vien cua tai khoan'
                )
            }

            await tx.student.update({
                where: { userId },
                data: {
                    mssv: data.mssv,
                    fullName: data.fullName,
                    facultyId: data.facultyId,
                    className: normalizeOptionalString(data.className),
                    phone: normalizeOptionalString(data.phone),
                    deletedAt: null,
                },
            })

            return loadUserManagementItem(userId, tx)
        }

        let facultyIdForManager: number | null = null
        if (data.role === 'LCD') {
            await ensureFacultyExists(tx, data.facultyId)
            facultyIdForManager = data.facultyId
        }
        if (data.role === 'CLB') {
            if (data.managedClubId) {
                facultyIdForManager = await ensureClubExists(
                    tx,
                    data.managedClubId
                )
            } else if (data.facultyId) {
                await ensureFacultyExists(tx, data.facultyId)
                facultyIdForManager = data.facultyId
            }
        }

        await tx.user.update({
            where: { id: userId },
            data: {
                username: data.username,
                email: data.email,
                role: data.role,
                ...(passwordHash ? { passwordHash } : {}),
            },
        })

        if (!existingUser.managerProfile) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Khong tim thay ho so quan ly cua tai khoan'
            )
        }

        await tx.managerAccount.update({
            where: { userId },
            data: {
                facultyId: facultyIdForManager,
                managedClubId:
                    data.role === 'CLB' ? (data.managedClubId ?? null) : null,
                deletedAt: null,
            },
        })

        return loadUserManagementItem(userId, tx)
    })
}

export const updateUserStatus = async (
    userId: string,
    data: UpdateUserStatusInput,
    actorUserId: string
) => {
    if (userId === actorUserId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Khong the tu khoa mo tai khoan cua chinh minh'
        )
    }

    await getEditableUser(userId)

    return prismaClient.$transaction(async (tx) => {
        if (data.status === 'LOCKED') {
            await tx.userRefreshToken.deleteMany({
                where: { userId },
            })
        }

        await tx.user.update({
            where: { id: userId },
            data: {
                status: data.status as UserAccountStatus,
            },
        })

        return loadUserManagementItem(userId, tx)
    })
}

export const deleteUser = async (userId: string, actorUserId: string) => {
    if (userId === actorUserId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Khong the tu xoa tai khoan cua chinh minh'
        )
    }

    const existingUser = await getEditableUser(userId)
    const deletedAt = new Date()

    return prismaClient.$transaction(async (tx) => {
        await tx.userRefreshToken.deleteMany({
            where: { userId },
        })

        if (existingUser.studentProfile) {
            await tx.student.update({
                where: { userId },
                data: { deletedAt },
            })
        }

        if (existingUser.managerProfile) {
            await tx.managerAccount.update({
                where: { userId },
                data: { deletedAt },
            })
        }

        return tx.user.update({
            where: { id: userId },
            data: {
                status: 'DISABLED',
                deletedAt,
            },
        })
    })
}
