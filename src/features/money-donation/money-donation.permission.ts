import { MoneyDonationCampaign, Campaign } from '@prisma/client'
import { UserRole } from './money-donation.types'

type CampaignWithMoneyPhase = Campaign & {
    moneyPhase?: MoneyDonationCampaign | null
}

export const canCreateMoneyPhase = (
    campaign: CampaignWithMoneyPhase,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Sinh viên không có quyền tạo giai đoạn quyên góp',
        }
    }

    if (campaign.moneyPhase) {
        return {
            allowed: false,
            message: 'Chiến dịch đã có giai đoạn quyên góp tiền',
        }
    }

    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (campaign.creatorId !== userId) {
        return {
            allowed: false,
            message: 'Bạn không phải là người tạo chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'PENDING') {
        return {
            allowed: false,
            message:
                'Chỉ có thể tạo giai đoạn khi chiến dịch ở trạng thái DRAFT hoặc PENDING',
        }
    }

    return { allowed: true }
}

export const canUpdateMoneyPhase = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Sinh viên không có quyền cập nhật giai đoạn quyên góp',
        }
    }

    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (campaign.creatorId !== userId) {
        return {
            allowed: false,
            message: 'Bạn không phải là người tạo chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'ACTIVE') {
        return {
            allowed: false,
            message:
                'Chỉ có thể cập nhật giai đoạn khi chiến dịch ở trạng thái DRAFT hoặc ACTIVE',
        }
    }

    return { allowed: true }
}

export const canDeleteMoneyPhase = (
    campaign: Campaign,
    moneyPhase: MoneyDonationCampaign | null,
    userId: string,
    userRole: UserRole,
    donationCount: number
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Sinh viên không có quyền xóa giai đoạn quyên góp',
        }
    }

    if (!moneyPhase) {
        return {
            allowed: false,
            message: 'Giai đoạn quyên góp không tồn tại',
        }
    }

    if (userRole === 'DOANTRUONG') {
        if (donationCount > 0) {
            return {
                allowed: false,
                message: 'Không thể xóa giai đoạn đã có đóng góp',
            }
        }
        return { allowed: true }
    }

    if (campaign.creatorId !== userId) {
        return {
            allowed: false,
            message: 'Bạn không phải là người tạo chiến dịch này',
        }
    }

    if (campaign.status !== 'DRAFT') {
        return {
            allowed: false,
            message:
                'Chỉ có thể xóa giai đoạn khi chiến dịch ở trạng thái DRAFT',
        }
    }

    if (donationCount > 0) {
        return {
            allowed: false,
            message: 'Không thể xóa giai đoạn đã có đóng góp',
        }
    }

    return { allowed: true }
}

export const canViewProgress = (
    campaign: Campaign
): { allowed: boolean; message?: string } => {
    if (campaign.status === 'ACTIVE' || campaign.status === 'COMPLETED') {
        return { allowed: true }
    }

    return {
        allowed: false,
        message:
            'Chỉ có thể xem tiến độ chiến dịch đang hoạt động hoặc đã hoàn thành',
    }
}

export const canViewPhaseDonations = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Sinh viên không có quyền xem danh sách đóng góp',
        }
    }

    if (userRole === 'DOANTRUONG') {
        return { allowed: true }
    }

    if (campaign.creatorId !== userId) {
        return {
            allowed: false,
            message: 'Bạn không phải là người tạo chiến dịch này',
        }
    }

    return { allowed: true }
}
