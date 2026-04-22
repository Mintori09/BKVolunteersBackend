import * as moneyDonationRepository from './money-donation.repository'
import * as campaignRepository from '../campaign/campaign.repository'
import {
    canCreateMoneyPhase,
    canUpdateMoneyPhase,
    canDeleteMoneyPhase,
    canViewProgress,
    canViewPhaseDonations,
} from './money-donation.permission'
import {
    CreateMoneyPhaseInput,
    UpdateMoneyPhaseInput,
    UserRole,
    DonationFilterQuery,
} from './money-donation.types'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { generateVietQrUrl } from 'src/utils/qr-generator'

export const createMoneyPhase = async (
    campaignId: string,
    data: CreateMoneyPhaseInput,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await campaignRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    const permissionCheck = canCreateMoneyPhase(
        campaign as any,
        userId,
        userRole
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const qrImageUrl = generateVietQrUrl(
        data.bankCode,
        data.bankAccountNo,
        data.bankAccountName,
        data.targetAmount
    )

    const moneyPhase = await moneyDonationRepository.createMoneyPhase(
        campaignId,
        {
            ...data,
            qrImageUrl,
        }
    )

    return moneyPhase
}

export const getMoneyPhaseById = async (phaseId: number) => {
    const moneyPhase = await moneyDonationRepository.findMoneyPhaseById(phaseId)

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    return moneyPhase
}

export const updateMoneyPhase = async (
    phaseId: number,
    data: UpdateMoneyPhaseInput,
    userId: string,
    userRole: UserRole
) => {
    const moneyPhase = await moneyDonationRepository.findMoneyPhaseById(phaseId)

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    const permissionCheck = canUpdateMoneyPhase(
        moneyPhase.campaign as any,
        userId,
        userRole
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    let qrImageUrl = moneyPhase.qrImageUrl
    if (
        data.bankCode ||
        data.bankAccountNo ||
        data.bankAccountName ||
        data.targetAmount
    ) {
        qrImageUrl = generateVietQrUrl(
            data.bankCode ?? moneyPhase.bankCode ?? '',
            data.bankAccountNo ?? moneyPhase.bankAccountNo ?? '',
            data.bankAccountName ?? moneyPhase.bankAccountName ?? '',
            data.targetAmount ?? Number(moneyPhase.targetAmount)
        )
    }

    const updatedPhase = await moneyDonationRepository.updateMoneyPhase(
        phaseId,
        {
            ...data,
            qrImageUrl: qrImageUrl ?? undefined,
        }
    )

    return updatedPhase
}

export const deleteMoneyPhase = async (
    phaseId: number,
    userId: string,
    userRole: UserRole
) => {
    const moneyPhase = await moneyDonationRepository.findMoneyPhaseById(phaseId)

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    const donationCount =
        await moneyDonationRepository.countDonationsByPhase(phaseId)

    const permissionCheck = canDeleteMoneyPhase(
        moneyPhase.campaign as any,
        moneyPhase,
        userId,
        userRole,
        donationCount
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    await moneyDonationRepository.softDeleteMoneyPhase(phaseId)

    return { message: 'Xóa giai đoạn quyên góp thành công' }
}

export const getPhaseProgress = async (phaseId: number) => {
    const moneyPhase = await moneyDonationRepository.findMoneyPhaseById(phaseId)

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    const permissionCheck = canViewProgress(moneyPhase.campaign as any)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const progress = await moneyDonationRepository.getPhaseProgress(phaseId)

    if (!progress) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy tiến độ')
    }

    return progress
}

export const getPhaseDonations = async (
    phaseId: number,
    query: DonationFilterQuery,
    userId: string,
    userRole: UserRole
) => {
    const moneyPhase = await moneyDonationRepository.findMoneyPhaseById(phaseId)

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    const permissionCheck = canViewPhaseDonations(
        moneyPhase.campaign as any,
        userId,
        userRole
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return moneyDonationRepository.findDonationsByPhase(phaseId, query)
}
