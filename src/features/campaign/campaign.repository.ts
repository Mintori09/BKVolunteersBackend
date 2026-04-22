import {
    CampaignApprovalStatus,
    CampaignPublicationStatus,
    CampaignStatusGroup,
    type OrganizerType,
    Prisma,
    type PrismaClient,
} from '@prisma/client'
import { prismaClient } from 'src/config'

type DbClient = Prisma.TransactionClient | PrismaClient

const resolveDbClient = (db?: DbClient) => db ?? prismaClient

const campaignDraftSelect = {
    id: true,
    title: true,
    description: true,
    organizerType: true,
    approvalStatus: true,
    publicationStatus: true,
    creatorManagerId: true,
    facultyId: true,
    clubId: true,
    createdAt: true,
    updatedAt: true,
    faculty: {
        select: {
            id: true,
            name: true,
            code: true,
        },
    },
    club: {
        select: {
            id: true,
            name: true,
        },
    },
    campaignFiles: {
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            fileId: true,
            fileType: true,
            createdAt: true,
            file: {
                select: {
                    id: true,
                    originalName: true,
                    mimeType: true,
                    fileSize: true,
                    createdAt: true,
                },
            },
        },
    },
} satisfies Prisma.CampaignSelect

export type CampaignDraftRecord = Prisma.CampaignGetPayload<{
    select: typeof campaignDraftSelect
}>

export const createDraftCampaign = async (
    data: {
        title: string
        description: string
        creatorManagerId: string
        organizerType: OrganizerType
        facultyId?: number | null
        clubId?: string | null
    },
    db?: DbClient
) => {
    return resolveDbClient(db).campaign.create({
        data: {
            title: data.title,
            description: data.description,
            creatorManagerId: data.creatorManagerId,
            organizerType: data.organizerType,
            facultyId: data.facultyId ?? null,
            clubId: data.clubId ?? null,
            approvalStatus: CampaignApprovalStatus.DRAFT,
            publicationStatus: CampaignPublicationStatus.NOT_PUBLIC,
            statusHistory: {
                create: [
                    {
                        statusGroup: CampaignStatusGroup.APPROVAL,
                        fromStatus: null,
                        toStatus: CampaignApprovalStatus.DRAFT,
                        changedById: data.creatorManagerId,
                        note: 'Campaign draft created',
                    },
                    {
                        statusGroup: CampaignStatusGroup.PUBLICATION,
                        fromStatus: null,
                        toStatus: CampaignPublicationStatus.NOT_PUBLIC,
                        changedById: data.creatorManagerId,
                        note: 'Campaign draft created',
                    },
                ],
            },
        },
        select: campaignDraftSelect,
    })
}

export const getDraftCampaignById = async (id: string, db?: DbClient) => {
    return resolveDbClient(db).campaign.findUnique({
        where: { id },
        select: campaignDraftSelect,
    })
}

export const updateDraftCampaign = async (
    id: string,
    data: {
        title: string
        description: string
    },
    db?: DbClient
) => {
    return resolveDbClient(db).campaign.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
        },
        select: campaignDraftSelect,
    })
}
