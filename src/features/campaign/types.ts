import { Campaign, CampaignScope, CampaignStatus } from '@prisma/client'

export type CreateCampaignInput = {
    title: string
    description?: string
    scope: CampaignScope
}

export type UpdateCampaignInput = {
    title?: string
    description?: string
}

export type SubmitCampaignInput = {
    id: string
}

export type ApproveCampaignInput = {
    id: string
    comment?: string
}

export type RejectCampaignInput = {
    id: string
    comment: string
}

export type CompleteCampaignInput = {
    id: string
    eventPhotos?: string[]
}

export type CancelCampaignInput = {
    id: string
}

export type UploadPlanFileInput = {
    id: string
    planFileUrl: string
}

export type UploadBudgetFileInput = {
    id: string
    budgetFileUrl: string
}

export type CampaignFilterQuery = {
    status?: CampaignStatus
    scope?: CampaignScope
    facultyId?: number
    creatorId?: string
    page?: number
    limit?: number
}

export type CampaignOutput = Campaign & {
    creator?: {
        id: string
        username: string
        email: string
        role: string
    }
    approver?: {
        id: string
        username: string
        email: string
    }
}

export type CampaignListOutput = {
    campaigns: CampaignOutput[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export type AvailableCampaignsOutput = {
    campaigns: CampaignOutput[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export type UserRole = 'SINHVIEN' | 'CLB' | 'LCD' | 'DOANTRUONG'

export type StatusTransition = {
    from: CampaignStatus
    to: CampaignStatus
    allowedRoles: UserRole[]
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
    {
        from: 'DRAFT',
        to: 'PENDING',
        allowedRoles: ['CLB', 'LCD', 'DOANTRUONG'],
    },
    { from: 'PENDING', to: 'ACTIVE', allowedRoles: ['DOANTRUONG'] },
    { from: 'PENDING', to: 'REJECTED', allowedRoles: ['DOANTRUONG'] },
    {
        from: 'REJECTED',
        to: 'PENDING',
        allowedRoles: ['CLB', 'LCD', 'DOANTRUONG'],
    },
    {
        from: 'ACTIVE',
        to: 'COMPLETED',
        allowedRoles: ['CLB', 'LCD', 'DOANTRUONG'],
    },
    {
        from: 'ACTIVE',
        to: 'CANCELLED',
        allowedRoles: ['CLB', 'LCD', 'DOANTRUONG'],
    },
]

export const CAMPAIGN_STATUS_VALUES = [
    'DRAFT',
    'PENDING',
    'ACTIVE',
    'REJECTED',
    'COMPLETED',
    'CANCELLED',
] as const

export const CAMPAIGN_SCOPE_VALUES = ['KHOA', 'TRUONG'] as const
