import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as fundraisingRepository from './fundraising.repository'
import {
    CreateFundraisingDonationBody,
    FundraisingDecisionBody,
    FundraisingDonationListQuery,
    FundraisingModuleConfigBody,
    SepayWebhookBody,
} from './types'

const serializeDonation = (
    donation: Awaited<ReturnType<typeof fundraisingRepository.findDonationById>>
) => {
    if (!donation) return null
    return {
        id: serializeId(donation.id)!,
        campaign_id: serializeId(donation.campaignId)!,
        module_id: serializeId(donation.moduleId)!,
        student_id: serializeId(donation.studentId)!,
        donor_name: donation.donorName,
        amount: Number(donation.amount),
        message: donation.message,
        evidence_url: donation.evidenceUrl,
        status: donation.status,
        matched_transaction_id: serializeId(donation.matchedTransactionId),
        verified_by: serializeId(donation.verifiedBy),
        verified_at: donation.verifiedAt,
        reject_reason: donation.rejectReason,
        created_at: donation.createdAt,
        updated_at: donation.updatedAt,
    }
}

const requireOperator = (payload?: { accountType?: string; userId?: string }) => {
    if (payload?.accountType !== 'OPERATOR' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }
}

const requireStudent = (payload?: { accountType?: string; userId?: string }) => {
    if (payload?.accountType !== 'STUDENT' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }
}

export const getModule = async (moduleIdRaw: string) => {
    const module = await fundraisingRepository.findModuleWithCampaign(
        BigInt(moduleIdRaw)
    )

    if (!module || module.type !== 'FUNDRAISING') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    const totalRaised = module.moneyDonations.reduce(
        (sum, item) => sum + Number(item.amount),
        0
    )

    return {
        id: serializeId(module.id)!,
        campaign_id: serializeId(module.campaignId)!,
        type: module.type,
        title: module.title,
        status: module.status,
        settings_json: module.settingsJson,
        total_raised: totalRaised,
        campaign: {
            id: serializeId(module.campaign.id)!,
            title: module.campaign.title,
            status: module.campaign.status,
            slug: module.campaign.slug,
        },
    }
}

export const updateModuleConfig = async (
    moduleIdRaw: string,
    body: FundraisingModuleConfigBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const module = await fundraisingRepository.updateModuleConfig({
        moduleId: BigInt(moduleIdRaw),
        settingsJson: body.settings_json ?? {},
        status: body.status,
    })

    return {
        id: serializeId(module.id)!,
        settings_json: module.settingsJson,
        status: module.status,
    }
}

export const createDonation = async (
    moduleIdRaw: string,
    body: CreateFundraisingDonationBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireStudent(payload)
    const userId = payload!.userId!
    const moduleId = BigInt(moduleIdRaw)
    const module = await fundraisingRepository.findModuleBaseById(moduleId)

    if (!module || module.type !== 'FUNDRAISING') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    const donation = await fundraisingRepository.createDonation({
        campaignId: module.campaignId,
        moduleId,
        studentId: BigInt(userId),
        donorName: body.donor_name ?? 'Sinh viên ẩn danh',
        amount: body.amount,
        message: body.message ?? null,
        evidenceUrl: body.evidence_url ?? null,
    })

    return serializeDonation(donation)
}

export const listDonations = async (
    moduleIdRaw: string,
    query: FundraisingDonationListQuery,
    payload?: { accountType?: string; userId?: string }
) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const where: any = { moduleId: BigInt(moduleIdRaw) }

    if (payload?.accountType === 'STUDENT' && payload.userId) {
        where.studentId = BigInt(payload.userId)
    }

    const [items, total] = await fundraisingRepository.findDonations({
        page,
        limit,
        where,
    })

    return serializePagination(
        items.map((item) => serializeDonation(item)!),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

const decideDonation = async (
    idRaw: string,
    payload: { accountType?: string; userId?: string } | undefined,
    status: 'VERIFIED' | 'REJECTED',
    body: FundraisingDecisionBody
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const donationId = BigInt(idRaw)
    const donation = await fundraisingRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Donation not found')
    }
    if (donation.status !== 'PENDING') {
        throw new ApiError(HttpStatus.CONFLICT, 'State conflict')
    }

    const updated = await fundraisingRepository.updateDonationDecision({
        id: donationId,
        userId: BigInt(userId),
        status,
        rejectReason:
            status === 'REJECTED'
                ? body.reason ?? body.reject_reason ?? ''
                : null,
    })

    await fundraisingRepository.createAuditLog({
        actorId: BigInt(userId),
        action: status === 'VERIFIED' ? 'DONATION_VERIFIED' : 'DONATION_REJECTED',
        entityId: donationId,
        beforeJson: { status: donation.status },
        afterJson:
            status === 'REJECTED'
                ? {
                      status: updated.status,
                      reject_reason: updated.rejectReason,
                  }
                : { status: updated.status },
    })

    return serializeDonation(updated)
}

export const verifyDonation = async (
    idRaw: string,
    body: FundraisingDecisionBody,
    payload?: { accountType?: string; userId?: string }
) => decideDonation(idRaw, payload, 'VERIFIED', body)

export const rejectDonation = async (
    idRaw: string,
    body: FundraisingDecisionBody,
    payload?: { accountType?: string; userId?: string }
) => decideDonation(idRaw, payload, 'REJECTED', body)

export const handleSepayWebhook = async (body: SepayWebhookBody, headers: {
    secret?: string
}) => {
    const configuredSecret = process.env.SEPAY_WEBHOOK_SECRET
    if (configuredSecret && headers.secret !== configuredSecret) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid webhook secret')
    }

    const provider = 'SEPAY'
    const providerTransactionId = String(
        body.transaction_id ?? body.id ?? body.gateway_transaction_id ?? ''
    )
    if (!providerTransactionId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing provider_transaction_id')
    }

    const amount = Number(body.amount ?? 0)
    const moduleId = body.module_id ? BigInt(body.module_id) : null
    const transaction = await fundraisingRepository.upsertPaymentTransaction({
        provider,
        providerTransactionId,
        amount,
        content: body.content ? String(body.content) : null,
        accountNo: body.account_number ? String(body.account_number) : null,
        transactionTime: new Date(
            body.transaction_time ?? body.created_at ?? Date.now()
        ),
        rawPayload: body,
        campaignId: body.campaign_id ? BigInt(body.campaign_id) : null,
        moduleId,
    })

    const matchedDonation = moduleId
        ? await fundraisingRepository.findPendingDonationMatch({ moduleId, amount })
        : null
    const updatedTransaction = await fundraisingRepository.updatePaymentTransactionMatch(
        {
            id: transaction.id,
            matchStatus: matchedDonation ? 'MATCHED' : 'UNMATCHED',
            matchedDonationId: matchedDonation?.id,
        }
    )

    if (matchedDonation) {
        await fundraisingRepository.attachDonationMatch({
            donationId: matchedDonation.id,
            transactionId: updatedTransaction.id,
        })
    }

    return {
        accepted: true,
        transaction_id: serializeId(updatedTransaction.id)!,
        match_status: updatedTransaction.matchStatus,
        matched_donation_id: serializeId(updatedTransaction.matchedDonationId),
        raw_payload: body,
    }
}
