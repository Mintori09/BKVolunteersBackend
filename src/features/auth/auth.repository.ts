import { prismaClient } from 'src/config'
import { UserRole } from './types'

const toBigIntId = (id: string) => BigInt(id)

const mapOperatorAccount = (account: any) => {
    if (!account) return null

    return {
        ...account,
        id: account.id.toString(),
        facultyId: account.facultyId ? account.facultyId.toString() : null,
        organizationId: account.organizationId
            ? account.organizationId.toString()
            : null,
        password: account.passwordHash,
        fullName: account.fullName,
    }
}

const mapStudent = (student: any) => {
    if (!student) return null

    return {
        ...student,
        id: student.id.toString(),
        facultyId: student.facultyId.toString(),
        currentTitleId: student.currentTitleId
            ? student.currentTitleId.toString()
            : null,
        mssv: student.studentCode,
        studentCode: student.studentCode,
        className: student.classCode,
        classCode: student.classCode,
        password: student.passwordHash,
    }
}

export const getUserByEmail = async (email: string) => {
    const account = await prismaClient.operatorAccount.findUnique({
        where: { email },
    })
    return mapOperatorAccount(account)
}

export const getUserByUsername = async (username: string) => {
    const account = await prismaClient.operatorAccount.findUnique({
        where: { email: username },
    })
    return mapOperatorAccount(account)
}

export const getUserByStudentEmail = async (email: string) => {
    const student = await prismaClient.student.findUnique({
        where: { email },
    })
    return mapStudent(student)
}

export const getUserByMssv = async (mssv: string) => {
    const student = await prismaClient.student.findUnique({
        where: { studentCode: mssv },
    })
    return mapStudent(student)
}

export const getUserById = async (userId: string, role: UserRole) => {
    if (role === 'STUDENT') {
        const student = await prismaClient.student.findUnique({
            where: { id: toBigIntId(userId) },
            include: {
                faculty: true,
            },
        })
        return mapStudent(student)
    }
    const account = await prismaClient.operatorAccount.findUnique({
        where: { id: toBigIntId(userId) },
        include: {
            faculty: true,
            organization: true,
        },
    })
    return mapOperatorAccount(account)
}

export const getUserByPrincipal = async (
    userId: string,
    accountType: 'STUDENT' | 'OPERATOR'
) => {
    if (accountType === 'STUDENT') {
        const student = await prismaClient.student.findUnique({
            where: { id: toBigIntId(userId) },
            include: {
                faculty: true,
                currentTitle: true,
            },
        })
        return mapStudent(student)
    }

    const account = await prismaClient.operatorAccount.findUnique({
        where: { id: toBigIntId(userId) },
        include: {
            faculty: true,
            organization: true,
        },
    })
    return mapOperatorAccount(account)
}

export const getRefreshTokenByToken = async (token: string) => {
    const refreshToken = await prismaClient.refreshToken.findUnique({
        where: { tokenHash: token },
    })
    if (refreshToken) {
        const role =
            refreshToken.accountType === 'STUDENT' ? 'STUDENT' : undefined

        return {
            ...refreshToken,
            id: refreshToken.id.toString(),
            studentId: refreshToken.studentId?.toString(),
            userId: refreshToken.operatorAccountId?.toString(),
            role,
            accountType: refreshToken.accountType as 'STUDENT' | 'OPERATOR',
            userType:
                refreshToken.accountType === 'STUDENT'
                    ? ('student' as const)
                    : ('user' as const),
        }
    }

    return null
}

export const deleteRefreshToken = async (token: string, role?: UserRole) => {
    if (role === 'STUDENT') {
        return prismaClient.refreshToken.deleteMany({
            where: { tokenHash: token, accountType: 'STUDENT' },
        })
    }
    if (role !== undefined) {
        return prismaClient.refreshToken.deleteMany({
            where: { tokenHash: token, accountType: 'OPERATOR' },
        })
    }

    return prismaClient.refreshToken.deleteMany({ where: { tokenHash: token } })
}

export const deleteAllUserRefreshTokens = async (
    userId: string,
    role: UserRole
) => {
    if (role === 'STUDENT') {
        return prismaClient.refreshToken.deleteMany({
            where: {
                studentId: toBigIntId(userId),
                accountType: 'STUDENT',
            },
        })
    }
    return prismaClient.refreshToken.deleteMany({
        where: {
            operatorAccountId: toBigIntId(userId),
            accountType: 'OPERATOR',
        },
    })
}

export const createRefreshToken = async (
    userId: string,
    token: string,
    role: UserRole
) => {
    return prismaClient.refreshToken.create({
        data: {
            tokenHash: token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            accountType: role === 'STUDENT' ? 'STUDENT' : 'OPERATOR',
            studentId:
                role === 'STUDENT' ? toBigIntId(userId) : undefined,
            operatorAccountId:
                role === 'STUDENT' ? undefined : toBigIntId(userId),
        },
    })
}

export const updatePassword = async (
    userId: string,
    hashedPassword: string,
    role: UserRole
) => {
    if (role === 'STUDENT') {
        return prismaClient.student.update({
            where: { id: toBigIntId(userId) },
            data: { passwordHash: hashedPassword },
        })
    }
    return prismaClient.operatorAccount.update({
        where: { id: toBigIntId(userId) },
        data: { passwordHash: hashedPassword },
    })
}
