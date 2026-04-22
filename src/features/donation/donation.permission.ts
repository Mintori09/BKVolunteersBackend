import { Donation, Campaign } from '@prisma/client'
import { UserRole } from './donation.types'

export const canSubmitDonation = (
    campaign: Campaign
): { allowed: boolean; message?: string } => {
    if (campaign.status !== 'ACTIVE') {
        return {
            allowed: false,
            message: 'Không thể đóng góp vào chiến dịch không hoạt động',
        }
    }

    return { allowed: true }
}

export const canProcessDonation = (
    campaign: Campaign,
    userId: string,
    userRole: UserRole
): { allowed: boolean; message?: string } => {
    if (userRole === 'SINHVIEN') {
        return {
            allowed: false,
            message: 'Sinh viên không có quyền xử lý đóng góp',
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

export const canRejectDonation = canProcessDonation
export const canVerifyDonation = canProcessDonation

export const canViewMyDonations = (
    studentId: string,
    userId: string
): boolean => {
    return studentId === userId
}
