import * as itemDonationRepository from './item-donation.repository'
import * as gamificationService from 'src/features/gamification/gamification.service'
import * as notificationService from 'src/features/notification/notification.service'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    CreateItemDonationInput,
    GetItemDonationsQuery,
    VerifyItemDonationInput,
} from './types'

export const createItemDonation = async (
    studentId: string,
    data: CreateItemDonationInput
) => {
    const itemPhase = await itemDonationRepository.findItemPhaseById(
        data.itemPhaseId
    )

    if (!itemPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp hiện vật'
        )
    }

    const now = new Date()
    if (itemPhase.startDate && now < itemPhase.startDate) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Giai đoạn quyên góp chưa bắt đầu'
        )
    }

    if (itemPhase.endDate && now > itemPhase.endDate) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Giai đoạn quyên góp đã kết thúc'
        )
    }

    const donation = await itemDonationRepository.createItemDonation(
        studentId,
        data
    )

    return donation
}

export const getItemDonationsByPhase = async (
    phaseId: number,
    userId: string,
    query: GetItemDonationsQuery
) => {
    const itemPhase = await itemDonationRepository.findItemPhaseById(phaseId)

    if (!itemPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp hiện vật'
        )
    }

    if (itemPhase.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền xem danh sách đóng góp này'
        )
    }

    return itemDonationRepository.findDonationsByPhaseId(phaseId, query)
}

export const verifyItemDonation = async (
    donationId: string,
    data: VerifyItemDonationInput,
    userId: string
) => {
    const donation = await itemDonationRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy đóng góp')
    }

    if (donation.status !== 'PENDING') {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể xác thực đóng góp đang chờ xử lý'
        )
    }

    if (!donation.itemPhase?.campaign) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy chiến dịch liên quan'
        )
    }

    if (donation.itemPhase.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền xác thực đóng góp này'
        )
    }

    const updatedDonation = await itemDonationRepository.verifyDonation(donationId)

    const points = data.points ?? 5
    if (points > 0) {
        await gamificationService.awardPoints({
            studentId: donation.studentId,
            points,
            reason: `Quyên góp hiện vật cho chiến dịch "${donation.itemPhase.campaign.title}"`,
            sourceType: 'ITEM_DONATION',
            sourceId: donationId,
            awardedBy: userId,
        })
    }

    await notificationService.createForStudent({
        studentId: donation.studentId,
        title: 'Đóng góp hiện vật đã được xác thực',
        message: `Đóng góp hiện vật của bạn cho chiến dịch "${donation.itemPhase.campaign.title}" đã được xác thực`,
        type: 'ITEM_DONATION_VERIFIED',
        relatedEntityType: 'donation',
        relatedEntityId: donationId,
    })

    return updatedDonation
}
