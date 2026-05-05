import * as donationRepository from './donation.repository'
import * as moneyDonationRepository from '../money-donation/money-donation.repository'
import * as gamificationService from '../gamification/gamification.service'
import {
    canSubmitDonation,
    canRejectDonation,
    canVerifyDonation,
} from './donation.permission'
import {
    CreateDonationInput,
    RejectDonationInput,
    VerifyDonationInput,
    UserRole,
    DonationFilterQuery,
    AdminDonationFilterQuery,
} from './donation.types'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import * as notificationService from 'src/features/notification/notification.service'

export const submitDonation = async (
    studentId: string,
    data: CreateDonationInput
) => {
    const moneyPhase = await donationRepository.findMoneyPhaseWithCampaign(
        data.moneyPhaseId
    )

    if (!moneyPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp'
        )
    }

    const permissionCheck = canSubmitDonation(moneyPhase.campaign as any)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const donation = await donationRepository.createDonation(studentId, data)

    return donation
}

export const rejectDonation = async (
    donationId: string,
    data: RejectDonationInput,
    userId: string,
    userRole: UserRole
) => {
    const donation = await donationRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy đóng góp')
    }

    if (donation.status !== 'PENDING') {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể từ chối đóng góp đang chờ xử lý'
        )
    }

    const campaign =
        donation.moneyPhase?.campaign || donation.itemPhase?.campaign
    if (!campaign) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy chiến dịch liên quan'
        )
    }

    const permissionCheck = canRejectDonation(campaign as any, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const updatedDonation = await donationRepository.rejectDonation(
        donationId,
        data.reason
    )

    await notificationService.createForStudent({
        studentId: donation.studentId,
        title: 'Đóng góp bị từ chối',
        message: `Đóng góp của bạn cho chiến dịch "${campaign.title}" bị từ chối. Lý do: ${data.reason}`,
        type: 'DONATION_REJECTED',
        relatedEntityType: 'donation',
        relatedEntityId: donationId,
    })

    return updatedDonation
}

export const verifyDonation = async (
    donationId: string,
    data: VerifyDonationInput,
    userId: string,
    userRole: UserRole
) => {
    const donation = await donationRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy đóng góp')
    }

    if (donation.status !== 'PENDING') {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể xác thực đóng góp đang chờ xử lý'
        )
    }

    const campaign =
        donation.moneyPhase?.campaign || donation.itemPhase?.campaign
    if (!campaign) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy chiến dịch liên quan'
        )
    }

    const permissionCheck = canVerifyDonation(campaign as any, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const isMoneyDonation = !!donation.moneyPhaseId
    const verifiedAmount = data.verifiedAmount ?? 0
    const pointsToAward = isMoneyDonation
        ? Math.floor(verifiedAmount / 10000)
        : data.points || 5

    const updatedDonation = await donationRepository.verifyDonation(
        donationId,
        verifiedAmount
    )

    if (pointsToAward > 0) {
        const reason = isMoneyDonation
            ? `Quyên góp ${verifiedAmount} VND cho chiến dịch "${campaign.title}"`
            : `Quyên góp hiện vật cho chiến dịch "${campaign.title}"`

        await gamificationService.awardPoints({
            studentId: donation.studentId,
            points: pointsToAward,
            reason,
            sourceType: isMoneyDonation ? 'MONEY_DONATION' : 'ITEM_DONATION',
            sourceId: donationId,
            awardedBy: userId,
        })
    }

    await notificationService.createForStudent({
        studentId: donation.studentId,
        title: 'Đóng góp đã được xác thực',
        message: `Đóng góp của bạn cho chiến dịch "${campaign.title}" đã được xác thực`,
        type: 'DONATION_VERIFIED',
        relatedEntityType: 'donation',
        relatedEntityId: donationId,
    })

    return updatedDonation
}

export const getMyDonations = async (
    studentId: string,
    query: DonationFilterQuery
) => {
    return donationRepository.findDonationsByStudent(studentId, query)
}

export const getDonationsForAdmin = async (query: AdminDonationFilterQuery) => {
    return donationRepository.findDonationsForAdmin(query)
}
