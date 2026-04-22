import { Campaign, CampaignScope } from '@prisma/client'
import { UserRole } from './types'

export const canCreateCampaign = (
    userRole: UserRole,
    scope: CampaignScope,
    userFacultyId?: string | null
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Bạn không có quyền tạo chiến dịch',
        }
    }

    if (scope === 'KHOA') {
        if (userRole === 'CLB') {
            return {
                allowed: false,
                message: 'CLB không thể tạo chiến dịch cấp khoa',
            }
        }

        if (
            (userRole === 'LCD' || userRole === 'DOANTRUONG') &&
            !userFacultyId
        ) {
            return {
                allowed: false,
                message: 'Bạn cần thuộc một khoa để tạo chiến dịch cấp khoa',
            }
        }
    }

    return { allowed: true }
}

export const isCampaignCreator = (
    campaign: Campaign,
    userId: string
): boolean => {
    return campaign.creatorId === userId
}

export const canEditCampaign = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Bạn không có quyền chỉnh sửa chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT') {
        return {
            allowed: false,
            message: 'Chỉ có thể chỉnh sửa chiến dịch ở trạng thái DRAFT',
        }
    }

    return { allowed: true }
}

export const canDeleteCampaign = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Bạn không có quyền xóa chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT') {
        return {
            allowed: false,
            message: 'Chỉ có thể xóa chiến dịch ở trạng thái DRAFT',
        }
    }

    return { allowed: true }
}

export const canSubmitCampaign = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Bạn không có quyền gửi phê duyệt chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT') {
        return {
            allowed: false,
            message: 'Chiến dịch không ở trạng thái DRAFT',
        }
    }

    return { allowed: true }
}

export const canApproveCampaign = (
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole !== 'DOANTRUONG') {
        return {
            allowed: false,
            message: 'Chỉ Đoàn trường có quyền phê duyệt chiến dịch',
        }
    }

    return { allowed: true }
}

export const canRejectCampaign = (
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole !== 'DOANTRUONG') {
        return {
            allowed: false,
            message: 'Chỉ Đoàn trường có quyền từ chối chiến dịch',
        }
    }

    return { allowed: true }
}

export const canCompleteCampaign = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Chỉ người tạo mới có thể hoàn thành chiến dịch',
        }
    }

    if (campaign.status !== 'ACTIVE') {
        return {
            allowed: false,
            message: 'Chiến dịch không ở trạng thái hoạt động',
        }
    }

    return { allowed: true }
}

export const canCancelCampaign = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Bạn không có quyền hủy chiến dịch này',
        }
    }

    if (campaign.status !== 'ACTIVE') {
        return {
            allowed: false,
            message: 'Chỉ có thể hủy chiến dịch đang hoạt động',
        }
    }

    return { allowed: true }
}

export const canUploadFile = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (!isCampaignCreator(campaign, userId)) {
        return {
            allowed: false,
            message: 'Bạn không có quyền upload file cho chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PENDING') {
        return {
            allowed: false,
            message:
                'Chỉ có thể upload file khi chiến dịch ở trạng thái DRAFT hoặc PENDING',
        }
    }

    return { allowed: true }
}

export const canViewCampaign = (
    campaign: Campaign,
    userRole: UserRole,
    userFacultyId?: string | null
): { allowed: boolean; message?: string } => {
    if (campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') {
        if (campaign.scope === 'KHOA') {
            if (userRole !== 'DOANTRUONG' && userFacultyId) {
                return { allowed: true }
            }
        }
        return { allowed: true }
    }

    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    return { allowed: true }
}
