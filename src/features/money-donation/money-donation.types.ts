import { MoneyDonationCampaign, DonationStatus } from '@prisma/client'

export type CreateMoneyPhaseInput = {
    targetAmount: number
    bankAccountNo: string
    bankAccountName: string
    bankCode: string
    startDate?: Date
    endDate?: Date
}

export type UpdateMoneyPhaseInput = {
    targetAmount?: number
    bankAccountNo?: string
    bankAccountName?: string
    bankCode?: string
    startDate?: Date
    endDate?: Date
}

export type UserRole = 'SINHVIEN' | 'CLB' | 'LCD' | 'DOANTRUONG'

export type MoneyPhaseProgress = {
    phaseId: number
    targetAmount: string
    currentAmount: string
    percentage: number
    totalDonations: number
    verifiedDonations: number
    pendingDonations: number
    rejectedDonations: number
    recentDonations: RecentDonation[]
}

export type RecentDonation = {
    id: string
    amount: string
    status: DonationStatus
    createdAt: Date
    student: {
        id: string
        mssv: string
        fullName: string
    }
}

export type MoneyPhaseWithCampaign = MoneyDonationCampaign & {
    campaign: {
        id: string
        title: string
        status: string
        creatorId: string
    }
}

export type DonationFilterQuery = {
    status?: DonationStatus
    page?: number
    limit?: number
}

export type DonationListOutput = {
    donations: DonationOutput[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export type DonationOutput = {
    id: string
    amount: string
    verifiedAmount: string | null
    proofImageUrl: string | null
    status: DonationStatus
    rejectionReason: string | null
    createdAt: Date
    student?: {
        id: string
        mssv: string
        fullName: string
    }
    moneyPhase?: {
        id: number
        campaign: {
            id: string
            title: string
        }
    }
}
