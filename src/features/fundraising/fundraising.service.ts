import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as fundraisingRepository from './fundraising.repository'
import {
    AttachFundraisingTransactionBody,
    CreateFundraisingDonationBody,
    FundraisingDecisionBody,
    FundraisingDonationListQuery,
    FundraisingModuleConfigOutput,
    FundraisingModuleConfigBody,
    FundraisingTransactionListQuery,
    SepayWebhookBody,
} from './types'

const serializeDonation = (donation: any) => {
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

const serializeTransaction = (transaction: any) => {
    if (!transaction) return null

    return {
        id: serializeId(transaction.id)!,
        provider: transaction.provider,
        provider_transaction_id: transaction.providerTransactionId,
        campaign_id: serializeId(transaction.campaignId),
        module_id: serializeId(transaction.moduleId),
        amount: Number(transaction.amount),
        content: transaction.content,
        account_no: transaction.accountNo,
        transaction_time: transaction.transactionTime,
        match_status: transaction.matchStatus,
        matched_donation_id: serializeId(transaction.matchedDonationId),
        created_at: transaction.createdAt,
        updated_at: transaction.updatedAt,
        matched_donation: transaction.matchedDonation
            ? {
                  id: serializeId(transaction.matchedDonation.id)!,
                  donor_name: transaction.matchedDonation.donorName,
                  amount: Number(transaction.matchedDonation.amount),
                  status: transaction.matchedDonation.status,
                  created_at: transaction.matchedDonation.createdAt,
              }
            : null,
    }
}

const isFundraisingModuleType = (value: string | null | undefined) =>
    value === 'FUNDRAISING' || value === 'fundraising'

type Principal = {
    accountType?: string
    userId?: string
    role?: string
    organizationId?: string | null
}

const requireOperator = (payload?: Principal) => {
    if (payload?.accountType !== 'OPERATOR' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    return payload
}

const requireStudent = (payload?: Principal) => {
    if (payload?.accountType !== 'STUDENT' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }

    return payload
}

const assertOperatorScope = (
    principal: Principal,
    organizationId: bigint | null | undefined
) => {
    if (principal.role === 'DOANTRUONG' || principal.role === 'LCD') {
        return
    }

    if (!principal.organizationId || !organizationId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền vận hành gây quỹ này')
    }

    if (principal.organizationId !== organizationId.toString()) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền vận hành gây quỹ này')
    }
}

const getFundraisingConfig = (settingsJson: unknown): Record<string, unknown> => {
    if (!settingsJson || typeof settingsJson !== 'object') {
        return {}
    }

    return settingsJson as Record<string, unknown>
}

const getTransactionOrganizationId = (transaction: {
    module?: { campaign?: { organizationId?: bigint | null } | null } | null
    campaign?: { organizationId?: bigint | null } | null
}) =>
    transaction.module?.campaign?.organizationId ??
    transaction.campaign?.organizationId ??
    null

const normalizeConfigInput = (
    body: FundraisingModuleConfigBody,
    currentConfig: Record<string, unknown>
) => {
    const nextConfig = {
        ...currentConfig,
        ...(body.settings_json ?? {}),
    }

    if (body.target_amount !== undefined) nextConfig.target_amount = body.target_amount
    if (body.receiver_name !== undefined) nextConfig.receiver_name = body.receiver_name
    if (body.bank_name !== undefined) nextConfig.bank_name = body.bank_name
    if (body.bank_account_no !== undefined)
        nextConfig.bank_account_no = body.bank_account_no
    if (body.currency !== undefined) nextConfig.currency = body.currency
    if (body.sepay_enabled !== undefined) nextConfig.sepay_enabled = body.sepay_enabled
    if (body.sepay_account_id !== undefined)
        nextConfig.sepay_account_id = body.sepay_account_id

    return nextConfig
}

const validateConfig = (config: Record<string, unknown>) => {
    if (Number(config.target_amount ?? 0) <= 0) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Mục tiêu gây quỹ phải lớn hơn 0')
    }

    if (!String(config.receiver_name ?? '').trim()) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Thiếu tên người thụ hưởng')
    }

    if (!String(config.bank_name ?? '').trim()) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Thiếu tên ngân hàng')
    }

    if (!String(config.bank_account_no ?? '').trim()) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Thiếu số tài khoản')
    }
}

const ensureDonationWindowOpen = (module: {
    status: string
    startAt: Date
    endAt: Date
    campaign: { status: string }
}) => {
    if (!['PUBLISHED', 'ONGOING'].includes(module.campaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Chiến dịch chưa mở để nhận đóng góp')
    }

    if (['CLOSED', 'CANCELLED'].includes(module.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Hạng mục gây quỹ đã đóng')
    }

    const now = Date.now()
    if (now < module.startAt.getTime()) {
        throw new ApiError(HttpStatus.CONFLICT, 'Hạng mục gây quỹ chưa mở')
    }

    if (now > module.endAt.getTime()) {
        throw new ApiError(HttpStatus.CONFLICT, 'Hạng mục gây quỹ đã kết thúc')
    }
}

export const getModule = async (moduleIdRaw: string) => {
    const module = await fundraisingRepository.findModuleWithCampaign(
        BigInt(moduleIdRaw)
    )

    if (!module || !isFundraisingModuleType(module.type)) {
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
    payload?: Principal
): Promise<FundraisingModuleConfigOutput> => {
    const operator = requireOperator(payload)
    const module = await fundraisingRepository.findModuleBaseById(BigInt(moduleIdRaw))

    if (!module || !isFundraisingModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)
    const config = normalizeConfigInput(body, getFundraisingConfig(module.settingsJson))
    validateConfig(config)

    const updated = await fundraisingRepository.updateModuleConfig({
        moduleId: BigInt(moduleIdRaw),
        settingsJson: config,
        status: body.status,
    })

    return {
        module_id: serializeId(updated.id)!,
        config: getFundraisingConfig(updated.settingsJson),
        status: updated.status,
    }
}

export const createDonation = async (
    moduleIdRaw: string,
    body: CreateFundraisingDonationBody,
    payload?: Principal
) => {
    const student = requireStudent(payload)
    const userId = student.userId!
    const moduleId = BigInt(moduleIdRaw)
    const module = await fundraisingRepository.findModuleBaseById(moduleId)

    if (!module || !isFundraisingModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    ensureDonationWindowOpen(module)
    const config = getFundraisingConfig(module.settingsJson)

    const donation = await fundraisingRepository.createDonation({
        campaignId: module.campaignId,
        moduleId,
        studentId: BigInt(userId),
        donorName: body.donor_name ?? 'Sinh viên ẩn danh',
        amount: body.amount,
        message: body.message ?? null,
        evidenceUrl: body.evidence_url ?? null,
    })

    return {
        ...serializeDonation(donation),
        payment_instruction: {
            receiver_name: String(config.receiver_name ?? '').trim() || null,
            bank_name: String(config.bank_name ?? '').trim() || null,
            bank_account_no: String(config.bank_account_no ?? '').trim() || null,
            amount: body.amount,
            currency: String(config.currency ?? 'VND'),
        },
    }
}

export const listDonations = async (
    moduleIdRaw: string,
    query: FundraisingDonationListQuery,
    payload?: Principal
) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const where: any = { moduleId: BigInt(moduleIdRaw) }

    if (query.status) where.status = query.status
    if (query.q) {
        where.OR = [
            { donorName: { contains: query.q } },
            { message: { contains: query.q } },
        ]
    }
    if (query.from || query.to) {
        where.createdAt = {}
        if (query.from) where.createdAt.gte = new Date(query.from)
        if (query.to) where.createdAt.lte = new Date(query.to)
    }

    if (payload?.accountType === 'STUDENT' && payload.userId) {
        where.studentId = BigInt(payload.userId)
    } else if (payload?.accountType === 'OPERATOR') {
        const operator = requireOperator(payload)
        const module = await fundraisingRepository.findModuleBaseById(
            BigInt(moduleIdRaw)
        )

        if (!module || !isFundraisingModuleType(module.type)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
        }

        assertOperatorScope(operator, module.campaign.organizationId)
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

export const listTransactions = async (
    query: FundraisingTransactionListQuery,
    payload?: Principal
) => {
    const operator = requireOperator(payload)
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const where: any = {}
    const andConditions: any[] = []

    if (query.match_status) where.matchStatus = query.match_status
    if (query.module_id) where.moduleId = BigInt(query.module_id)
    if (query.campaign_id) where.campaignId = BigInt(query.campaign_id)
    if (query.q) {
        andConditions.push({
            OR: [
                { content: { contains: query.q } },
                { providerTransactionId: { contains: query.q } },
                { accountNo: { contains: query.q } },
            ],
        })
    }
    if (query.from || query.to) {
        where.transactionTime = {}
        if (query.from) where.transactionTime.gte = new Date(query.from)
        if (query.to) where.transactionTime.lte = new Date(query.to)
    }

    if (
        operator.role !== 'DOANTRUONG' &&
        operator.role !== 'LCD' &&
        operator.organizationId
    ) {
        andConditions.push({
            OR: [
                {
                    module: {
                        campaign: { organizationId: BigInt(operator.organizationId) },
                    },
                },
                { campaign: { organizationId: BigInt(operator.organizationId) } },
            ],
        })
    }

    if (andConditions.length > 0) {
        where.AND = andConditions
    }

    const [items, total] = await fundraisingRepository.findPaymentTransactions({
        page,
        limit,
        where,
    })

    return serializePagination(
        items.map((item) => serializeTransaction(item)!),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

export const attachTransactionToDonation = async (
    transactionIdRaw: string,
    body: AttachFundraisingTransactionBody,
    payload?: Principal
) => {
    const operator = requireOperator(payload)
    const transactionId = BigInt(transactionIdRaw)
    const donationId = BigInt(body.donation_id)
    const [transaction, donation] = await Promise.all([
        fundraisingRepository.findPaymentTransactionById(transactionId),
        fundraisingRepository.findDonationById(donationId),
    ])

    if (!transaction) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Transaction not found')
    }
    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Donation not found')
    }

    assertOperatorScope(operator, getTransactionOrganizationId(transaction))
    assertOperatorScope(operator, donation.module?.campaign.organizationId)

    if (
        transaction.moduleId &&
        donation.moduleId &&
        transaction.moduleId !== donation.moduleId
    ) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Transaction và donation không thuộc cùng module'
        )
    }

    if (
        transaction.matchedDonationId &&
        transaction.matchedDonationId !== donation.id
    ) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Transaction đã gắn với donation khác'
        )
    }

    if (
        donation.matchedTransactionId &&
        donation.matchedTransactionId !== transaction.id
    ) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Donation đã gắn với transaction khác'
        )
    }

    if (!['PENDING', 'MATCHED'].includes(donation.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Donation không ở trạng thái cho phép đối soát'
        )
    }

    const updatedTransaction = await fundraisingRepository.updatePaymentTransactionMatch(
        {
            id: transaction.id,
            matchStatus: 'MATCHED',
            matchedDonationId: donation.id,
        }
    )

    await fundraisingRepository.attachDonationMatch({
        donationId: donation.id,
        transactionId: transaction.id,
    })

    return serializeTransaction(updatedTransaction)
}

export const unmatchTransaction = async (
    transactionIdRaw: string,
    payload?: Principal
) => {
    const operator = requireOperator(payload)
    const transactionId = BigInt(transactionIdRaw)
    const transaction =
        await fundraisingRepository.findPaymentTransactionById(transactionId)

    if (!transaction) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Transaction not found')
    }

    assertOperatorScope(operator, getTransactionOrganizationId(transaction))

    const updatedTransaction = await fundraisingRepository.updatePaymentTransactionMatch(
        {
            id: transaction.id,
            matchStatus: 'UNMATCHED',
            matchedDonationId: undefined,
        }
    )

    if (transaction.matchedDonationId) {
        await fundraisingRepository.clearDonationMatch({
            donationId: transaction.matchedDonationId,
            status:
                transaction.matchedDonation?.status === 'MATCHED'
                    ? 'PENDING'
                    : undefined,
        })
    }

    return serializeTransaction(updatedTransaction)
}

const decideDonation = async (
    idRaw: string,
    payload: Principal | undefined,
    status: 'VERIFIED' | 'REJECTED',
    body: FundraisingDecisionBody
) => {
    const operator = requireOperator(payload)
    const userId = operator.userId!
    const donationId = BigInt(idRaw)
    const donation = await fundraisingRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Donation not found')
    }
    assertOperatorScope(operator, donation.module?.campaign.organizationId)
    if (!['PENDING', 'MATCHED'].includes(donation.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'State conflict')
    }

    if (status === 'VERIFIED' && body.transaction_id) {
        const transaction = await fundraisingRepository.findPaymentTransactionById(
            BigInt(body.transaction_id)
        )

        if (
            !transaction ||
            transaction.matchStatus !== 'MATCHED' ||
            transaction.matchedDonationId !== donation.id
        ) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Transaction không khớp donation đang xác minh'
            )
        }
    }

    if (status === 'REJECTED' && donation.matchedTransactionId) {
        await fundraisingRepository.updatePaymentTransactionMatch({
            id: donation.matchedTransactionId,
            matchStatus: 'UNMATCHED',
            matchedDonationId: undefined,
        })
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
                      transaction_id: body.transaction_id,
                  }
                : {
                      status: updated.status,
                      transaction_id: body.transaction_id,
                  },
    })

    if (status === 'REJECTED' && donation.matchedTransactionId) {
        await fundraisingRepository.clearDonationMatch({
            donationId,
        })
    }

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
