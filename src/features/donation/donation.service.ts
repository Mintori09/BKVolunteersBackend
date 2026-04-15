import * as donationRepository from './donation.repository'
import * as moneyDonationRepository from '../money-donation/money-donation.repository'
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
} from './donation.types'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

export const submitDonation = async (
    studentId: string,
    data: CreateDonationInput
) => {
    const moneyPhase = await donationRepository.findMoneyPhaseWithCampaign(data.moneyPhaseId)

    if (!moneyPhase) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy giai đoạn quyên góp')
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
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Chỉ có thể từ chối đóng góp đang chờ xử lý')
    }

    if (!donation.moneyPhase?.campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch liên quan')
    }

    const permissionCheck = canRejectDonation(
        donation.moneyPhase.campaign as any,
        userId,
        userRole
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const updatedDonation = await donationRepository.rejectDonation(donationId, data.reason)

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
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Chỉ có thể xác thực đóng góp đang chờ xử lý')
    }

    if (!donation.moneyPhase?.campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch liên quan')
    }

    const permissionCheck = canVerifyDonation(
        donation.moneyPhase.campaign as any,
        userId,
        userRole
    )
    if (!permissionCheck.allowed) {
        throw new ApiError(HttpStatus.FORBIDDEN, permissionCheck.message!)
    }

    const updatedDonation = await donationRepository.verifyDonation(
        donationId,
        data.verifiedAmount
    )

    return updatedDonation
}

export const getMyDonations = async (
    studentId: string,
    query: DonationFilterQuery
) => {
    return donationRepository.findDonationsByStudent(studentId, query)
}
