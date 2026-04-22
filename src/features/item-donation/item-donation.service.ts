import * as itemDonationRepository from './item-donation.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CreateItemDonationInput, GetItemDonationsQuery } from './types'

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
