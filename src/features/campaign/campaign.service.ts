import * as campaignRepository from './campaign.repository'
import {
    canCreateCampaign,
    canEditCampaign,
    canDeleteCampaign,
    canSubmitCampaign,
    canApproveCampaign,
    canRejectCampaign,
    canCompleteCampaign,
    canCancelCampaign,
    canUploadFile,
} from './campaign.permission'
import {
    validateStatusTransition,
    isCampaignApprovable,
    isCampaignRejectable,
    isCampaignCompletable,
    isCampaignCancellable,
    isCampaignSubmittable,
} from './campaign.status'
import {
    CreateCampaignInput,
    UpdateCampaignInput,
    UserRole,
    CampaignFilterQuery,
} from './types'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { Campaign } from '@prisma/client'

export const createCampaign = async (
    data: CreateCampaignInput,
    userId: string,
    userRole: UserRole,
    userFacultyId?: string | null
) => {
    const permissionCheck = canCreateCampaign(
        userRole,
        data.scope,
        userFacultyId
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return campaignRepository.createCampaign({
        ...data,
        creatorId: userId,
    })
}

export const getCampaignById = async (id: string) => {
    const campaign = await campaignRepository.findCampaignById(id)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    return campaign
}

export const updateCampaign = async (
    id: string,
    data: UpdateCampaignInput,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canEditCampaign(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return campaignRepository.updateCampaign(id, data)
}

export const deleteCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canDeleteCampaign(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return campaignRepository.softDeleteCampaign(id)
}

export const submitCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canSubmitCampaign(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    if (!isCampaignSubmittable(campaign.status)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch không ở trạng thái DRAFT'
        )
    }

    const statusCheck = validateStatusTransition(
        campaign.status,
        'PENDING',
        userRole
    )
    if (!statusCheck.valid) {
        throw new ApiError(HttpStatus.BAD_REQUEST, statusCheck.message!)
    }

    return campaignRepository.updateCampaignStatus(id, 'PENDING')
}

export const approveCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole,
    comment?: string
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canApproveCampaign(userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    if (!isCampaignApprovable(campaign.status)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch không ở trạng thái chờ phê duyệt'
        )
    }

    const statusCheck = validateStatusTransition(
        campaign.status,
        'ACTIVE',
        userRole
    )
    if (!statusCheck.valid) {
        throw new ApiError(HttpStatus.BAD_REQUEST, statusCheck.message!)
    }

    return campaignRepository.updateCampaignStatus(id, 'ACTIVE', {
        approverId: userId,
        adminComment: comment,
    })
}

export const rejectCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole,
    comment: string
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canRejectCampaign(userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    if (!isCampaignRejectable(campaign.status)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch không ở trạng thái chờ phê duyệt'
        )
    }

    const statusCheck = validateStatusTransition(
        campaign.status,
        'REJECTED',
        userRole
    )
    if (!statusCheck.valid) {
        throw new ApiError(HttpStatus.BAD_REQUEST, statusCheck.message!)
    }

    return campaignRepository.updateCampaignStatus(id, 'REJECTED', {
        approverId: userId,
        adminComment: comment,
    })
}

export const completeCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole,
    eventPhotos?: string[]
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canCompleteCampaign(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    if (!isCampaignCompletable(campaign.status)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch không ở trạng thái hoạt động'
        )
    }

    const statusCheck = validateStatusTransition(
        campaign.status,
        'COMPLETED',
        userRole
    )
    if (!statusCheck.valid) {
        throw new ApiError(HttpStatus.BAD_REQUEST, statusCheck.message!)
    }

    return campaignRepository.updateCampaignStatus(id, 'COMPLETED')
}

export const cancelCampaign = async (
    id: string,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canCancelCampaign(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    if (!isCampaignCancellable(campaign.status)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể hủy chiến dịch đang hoạt động'
        )
    }

    const statusCheck = validateStatusTransition(
        campaign.status,
        'CANCELLED',
        userRole
    )
    if (!statusCheck.valid) {
        throw new ApiError(HttpStatus.BAD_REQUEST, statusCheck.message!)
    }

    return campaignRepository.updateCampaignStatus(id, 'CANCELLED')
}

export const uploadPlanFile = async (
    id: string,
    planFileUrl: string,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canUploadFile(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return campaignRepository.updatePlanFileUrl(id, planFileUrl)
}

export const uploadBudgetFile = async (
    id: string,
    budgetFileUrl: string,
    userId: string,
    userRole: UserRole
) => {
    const campaign = await getCampaignById(id)

    const permissionCheck = canUploadFile(campaign, userId, userRole)
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    return campaignRepository.updateBudgetFileUrl(id, budgetFileUrl)
}

export const getCampaigns = async (query: CampaignFilterQuery) => {
    return campaignRepository.findCampaignsWithFilter(query)
}

export const getAvailableCampaigns = async (
    userRole: UserRole,
    userFacultyId?: string | null,
    page: number = 1,
    limit: number = 10
) => {
    return campaignRepository.findAvailableCampaigns(
        userRole,
        userFacultyId,
        page,
        limit
    )
}
