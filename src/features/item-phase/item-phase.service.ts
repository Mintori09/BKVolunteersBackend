import * as itemPhaseRepository from './item-phase.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CreateItemPhaseInput, UpdateItemPhaseInput } from './types'

export const createItemPhase = async (
    campaignId: string,
    creatorId: string,
    data: CreateItemPhaseInput
) => {
    const campaign = await itemPhaseRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (campaign.creatorId !== creatorId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không phải là người tạo chiến dịch này'
        )
    }

    const existingPhase =
        await itemPhaseRepository.findItemPhaseByCampaignId(campaignId)
    if (existingPhase) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chiến dịch đã có giai đoạn quyên góp hiện vật'
        )
    }

    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Ngày bắt đầu phải trước ngày kết thúc'
        )
    }

    return itemPhaseRepository.createItemPhase(campaignId, data)
}

export const getItemPhaseByCampaignId = async (campaignId: string) => {
    const itemPhase =
        await itemPhaseRepository.findItemPhaseByCampaignId(campaignId)

    if (!itemPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp hiện vật'
        )
    }

    return itemPhase
}

export const updateItemPhase = async (
    campaignId: string,
    phaseId: number,
    creatorId: string,
    data: UpdateItemPhaseInput
) => {
    const campaign = await itemPhaseRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (campaign.creatorId !== creatorId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không phải là người tạo chiến dịch này'
        )
    }

    const existingPhase = await itemPhaseRepository.findItemPhaseById(phaseId)

    if (!existingPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp hiện vật'
        )
    }

    if (existingPhase.campaignId !== campaignId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Giai đoạn không thuộc chiến dịch này'
        )
    }

    const startDate = data.startDate ?? existingPhase.startDate
    const endDate = data.endDate ?? existingPhase.endDate
    if (startDate && endDate && startDate >= endDate) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Ngày bắt đầu phải trước ngày kết thúc'
        )
    }

    return itemPhaseRepository.updateItemPhase(phaseId, data)
}

export const deleteItemPhase = async (
    campaignId: string,
    phaseId: number,
    creatorId: string
) => {
    const campaign = await itemPhaseRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (campaign.creatorId !== creatorId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không phải là người tạo chiến dịch này'
        )
    }

    const existingPhase = await itemPhaseRepository.findItemPhaseById(phaseId)

    if (!existingPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy giai đoạn quyên góp hiện vật'
        )
    }

    if (existingPhase.campaignId !== campaignId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Giai đoạn không thuộc chiến dịch này'
        )
    }

    const donationCount =
        await itemPhaseRepository.countDonationsByPhaseId(phaseId)
    if (donationCount > 0) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Không thể xóa giai đoạn đã có đóng góp'
        )
    }

    return itemPhaseRepository.deleteItemPhase(phaseId)
}
