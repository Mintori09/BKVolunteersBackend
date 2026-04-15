import { DonationStatus } from '@prisma/client'

export type CreateDonationInput = {
    moneyPhaseId: number
    amount: number
    proofImageUrl: string
}

export type RejectDonationInput = {
    reason: string
}

export type VerifyDonationInput = {
    verifiedAmount?: number
    points?: number
}

export type UserRole = 'SINHVIEN' | 'CLB' | 'LCD' | 'DOANTRUONG'

export type DonationFilterQuery = {
    status?: DonationStatus
    page?: number
    limit?: number
}

export type AdminDonationFilterQuery = {
    status?: DonationStatus
    phaseId?: number
    phaseType?: 'money' | 'item'
    studentId?: string
    page?: number
    limit?: number
}

export type DonationWithStudent = {
    id: string
    amount: string
    verifiedAmount: string | null
    proofImageUrl: string | null
    status: DonationStatus
    rejectionReason: string | null
    createdAt: Date
    student: {
        id: string
        mssv: string
        fullName: string
    }
}

export type DonationWithPhase = {
    id: string
    amount: string
    verifiedAmount: string | null
    proofImageUrl: string | null
    status: DonationStatus
    rejectionReason: string | null
    createdAt: Date
    moneyPhase: {
        id: number
        campaign: {
            id: string
            title: string
        }
    }
}
