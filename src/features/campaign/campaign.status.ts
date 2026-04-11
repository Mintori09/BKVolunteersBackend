import { CampaignStatus } from '@prisma/client'
import { UserRole, StatusTransition, STATUS_TRANSITIONS } from './types'

export const canTransitionTo = (
    currentStatus: CampaignStatus,
    targetStatus: CampaignStatus,
    userRole: UserRole
): boolean => {
    const transition = STATUS_TRANSITIONS.find(
        (t) => t.from === currentStatus && t.to === targetStatus
    )

    if (!transition) {
        return false
    }

    return transition.allowedRoles.includes(userRole)
}

export const getValidTransitions = (
    currentStatus: CampaignStatus,
    userRole: UserRole
): CampaignStatus[] => {
    return STATUS_TRANSITIONS
        .filter(
            (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
        )
        .map((t) => t.to)
}

export const validateStatusTransition = (
    currentStatus: CampaignStatus,
    targetStatus: CampaignStatus,
    userRole: UserRole
): { valid: boolean; message?: string } => {
    const validTransitions = getValidTransitions(currentStatus, userRole)

    if (!validTransitions.includes(targetStatus)) {
        const statusMessages: Record<CampaignStatus, Record<CampaignStatus, string>> = {
            DRAFT: {
                DRAFT: 'Chiến dịch đã ở trạng thái DRAFT',
                PENDING: 'Chiến dịch đã được gửi phê duyệt',
                ACTIVE: 'Chiến dịch cần được phê duyệt trước khi kích hoạt',
                REJECTED: 'Chiến dịch cần được gửi phê duyệt trước khi bị từ chối',
                COMPLETED: 'Chiến dịch cần được kích hoạt trước khi hoàn thành',
                CANCELLED: 'Chiến dịch cần được kích hoạt trước khi hủy',
            },
            PENDING: {
                DRAFT: 'Không thể chuyển về trạng thái DRAFT',
                PENDING: 'Chiến dịch đã ở trạng thái PENDING',
                ACTIVE: 'Chỉ Đoàn trường có quyền phê duyệt chiến dịch',
                REJECTED: 'Chỉ Đoàn trường có quyền từ chối chiến dịch',
                COMPLETED: 'Chiến dịch cần được phê duyệt trước khi hoàn thành',
                CANCELLED: 'Không thể hủy chiến dịch đang chờ phê duyệt',
            },
            ACTIVE: {
                DRAFT: 'Không thể chuyển về trạng thái DRAFT',
                PENDING: 'Không thể chuyển về trạng thái PENDING',
                ACTIVE: 'Chiến dịch đã ở trạng thái ACTIVE',
                REJECTED: 'Không thể từ chối chiến dịch đã được kích hoạt',
                COMPLETED: 'Chiến dịch đã được đánh dấu hoàn thành',
                CANCELLED: 'Chiến dịch đã bị hủy',
            },
            REJECTED: {
                DRAFT: 'Không thể chuyển về trạng thái DRAFT',
                PENDING: 'Chiến dịch đã được gửi phê duyệt lại',
                ACTIVE: 'Chiến dịch cần được phê duyệt trước khi kích hoạt',
                REJECTED: 'Chiến dịch đã ở trạng thái REJECTED',
                COMPLETED: 'Chiến dịch cần được kích hoạt trước khi hoàn thành',
                CANCELLED: 'Không thể hủy chiến dịch đã bị từ chối',
            },
            COMPLETED: {
                DRAFT: 'Không thể chuyển về trạng thái DRAFT',
                PENDING: 'Không thể chuyển về trạng thái PENDING',
                ACTIVE: 'Không thể chuyển về trạng thái ACTIVE',
                REJECTED: 'Không thể từ chối chiến dịch đã hoàn thành',
                COMPLETED: 'Chiến dịch đã ở trạng thái COMPLETED',
                CANCELLED: 'Không thể hủy chiến dịch đã hoàn thành',
            },
            CANCELLED: {
                DRAFT: 'Không thể chuyển về trạng thái DRAFT',
                PENDING: 'Không thể chuyển về trạng thái PENDING',
                ACTIVE: 'Không thể chuyển về trạng thái ACTIVE',
                REJECTED: 'Không thể từ chối chiến dịch đã bị hủy',
                COMPLETED: 'Không thể hoàn thành chiến dịch đã bị hủy',
                CANCELLED: 'Chiến dịch đã ở trạng thái CANCELLED',
            },
        }

        return {
            valid: false,
            message: statusMessages[currentStatus]?.[targetStatus] || 'Chuyển trạng thái không hợp lệ',
        }
    }

    return { valid: true }
}

export const isCampaignEditable = (status: CampaignStatus): boolean => {
    return status === 'DRAFT'
}

export const isCampaignDeletable = (status: CampaignStatus): boolean => {
    return status === 'DRAFT'
}

export const isCampaignSubmittable = (status: CampaignStatus): boolean => {
    return status === 'DRAFT'
}

export const isCampaignApprovable = (status: CampaignStatus): boolean => {
    return status === 'PENDING'
}

export const isCampaignRejectable = (status: CampaignStatus): boolean => {
    return status === 'PENDING'
}

export const isCampaignCompletable = (status: CampaignStatus): boolean => {
    return status === 'ACTIVE'
}

export const isCampaignCancellable = (status: CampaignStatus): boolean => {
    return status === 'ACTIVE'
}