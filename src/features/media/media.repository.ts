import { CampaignFileType, Prisma, type PrismaClient } from '@prisma/client'
import { prismaClient } from 'src/config'

export type DbClient = Prisma.TransactionClient | PrismaClient

const resolveDbClient = (db?: DbClient) => db ?? prismaClient

const fileRecordSelect = {
    id: true,
    storageKey: true,
    originalName: true,
    mimeType: true,
    fileSize: true,
    uploadedByStudentId: true,
    uploadedByManagerId: true,
    createdAt: true,
} satisfies Prisma.FileSelect

export type FileRecord = Prisma.FileGetPayload<{
    select: typeof fileRecordSelect
}>

const fileRelationSelect = {
    select: fileRecordSelect,
} as const

export const getFileById = async (id: string, db?: DbClient) => {
    return resolveDbClient(db).file.findUnique({
        where: { id },
        select: fileRecordSelect,
    })
}

export const createFileRecord = async (
    data: Prisma.FileUncheckedCreateInput,
    db?: DbClient
) => {
    return resolveDbClient(db).file.create({
        data,
        select: fileRecordSelect,
    })
}

export const updateFileRecord = async (
    id: string,
    data: Prisma.FileUncheckedUpdateInput,
    db?: DbClient
) => {
    return resolveDbClient(db).file.update({
        where: { id },
        data,
        select: fileRecordSelect,
    })
}

export const deleteFileRecord = async (id: string, db?: DbClient) => {
    return resolveDbClient(db).file.delete({
        where: { id },
        select: fileRecordSelect,
    })
}

export const findStudentAvatarTarget = async (studentId: string) => {
    return prismaClient.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            avatarFileId: true,
            avatarFile: fileRelationSelect,
        },
    })
}

export const attachStudentAvatar = async (
    studentId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).student.update({
        where: { id: studentId },
        data: {
            avatarFileId: fileId,
        },
        select: {
            id: true,
            avatarFileId: true,
        },
    })
}

export const findCampaignCoverTarget = async (campaignId: string) => {
    return prismaClient.campaign.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            coverFileId: true,
            coverFile: fileRelationSelect,
        },
    })
}

export const attachCampaignCover = async (
    campaignId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).campaign.update({
        where: { id: campaignId },
        data: {
            coverFileId: fileId,
        },
        select: {
            id: true,
            coverFileId: true,
        },
    })
}

export const findCampaignLogoTarget = async (campaignId: string) => {
    return prismaClient.campaign.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            logoFileId: true,
            logoFile: fileRelationSelect,
        },
    })
}

export const attachCampaignLogo = async (
    campaignId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).campaign.update({
        where: { id: campaignId },
        data: {
            logoFileId: fileId,
        },
        select: {
            id: true,
            logoFileId: true,
        },
    })
}

export const findFundraisingQrTarget = async (phaseId: string) => {
    return prismaClient.phaseFundraisingConfig.findUnique({
        where: { phaseId },
        select: {
            phaseId: true,
            qrFileId: true,
            qrFile: fileRelationSelect,
        },
    })
}

export const attachFundraisingQr = async (
    phaseId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).phaseFundraisingConfig.update({
        where: { phaseId },
        data: {
            qrFileId: fileId,
        },
        select: {
            phaseId: true,
            qrFileId: true,
        },
    })
}

export const findContributionProofTarget = async (contributionId: string) => {
    return prismaClient.contribution.findUnique({
        where: { id: contributionId },
        select: {
            id: true,
            proofFileId: true,
            proofFile: fileRelationSelect,
        },
    })
}

export const attachContributionProof = async (
    contributionId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).contribution.update({
        where: { id: contributionId },
        data: {
            proofFileId: fileId,
        },
        select: {
            id: true,
            proofFileId: true,
        },
    })
}

export const findCertificateTemplateTarget = async (phaseId: string) => {
    return prismaClient.phaseVolunteerConfig.findUnique({
        where: { phaseId },
        select: {
            phaseId: true,
            certificateTemplateFileId: true,
            certificateTemplateFile: fileRelationSelect,
        },
    })
}

export const attachCertificateTemplate = async (
    phaseId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).phaseVolunteerConfig.update({
        where: { phaseId },
        data: {
            certificateTemplateFileId: fileId,
        },
        select: {
            phaseId: true,
            certificateTemplateFileId: true,
        },
    })
}

export const findCertificateIssuedTarget = async (certificateId: string) => {
    return prismaClient.certificate.findUnique({
        where: { id: certificateId },
        select: {
            id: true,
            fileId: true,
            file: fileRelationSelect,
        },
    })
}

export const attachCertificateIssuedFile = async (
    certificateId: string,
    fileId: string,
    db?: DbClient
) => {
    return resolveDbClient(db).certificate.update({
        where: { id: certificateId },
        data: {
            fileId,
        },
        select: {
            id: true,
            fileId: true,
        },
    })
}

export const getCampaignById = async (campaignId: string) => {
    return prismaClient.campaign.findUnique({
        where: { id: campaignId },
        select: { id: true },
    })
}

export const getCampaignPhaseById = async (
    phaseId: string,
    campaignId?: string
) => {
    return prismaClient.campaignPhase.findFirst({
        where: {
            id: phaseId,
            ...(campaignId ? { campaignId } : {}),
        },
        select: {
            id: true,
            campaignId: true,
        },
    })
}

export const createCampaignFileLink = async (
    data: {
        campaignId: string
        phaseId?: string
        fileId: string
        fileType: CampaignFileType
        isPublic: boolean
    },
    db?: DbClient
) => {
    return resolveDbClient(db).campaignFile.create({
        data,
        select: {
            id: true,
            campaignId: true,
            phaseId: true,
            fileId: true,
            fileType: true,
            isPublic: true,
        },
    })
}

export const getStudentById = async (studentId: string) => {
    return prismaClient.student.findUnique({
        where: { id: studentId },
        select: { id: true },
    })
}

export const getManagerById = async (managerId: string) => {
    return prismaClient.managerAccount.findUnique({
        where: { id: managerId },
        select: { id: true },
    })
}
