import { HttpStatus } from 'src/common/constants'
import { config as appConfig } from 'src/config'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import crypto from 'crypto'
import { generateVietQrUrl } from 'src/utils/qr-generator'
import * as fundraisingRepository from './fundraising.repository'
import * as sepayClient from './sepay.client'
import {
    AttachFundraisingTransactionBody,
    CreateFundraisingDonationBody,
    FundraisingDecisionBody,
    FundraisingDonationListQuery,
    FundraisingModuleConfigOutput,
    FundraisingModuleConfigBody,
    FundraisingTransactionListQuery,
    SepayApiSyncAccountsQuery,
    SepayApiSyncTransactionsBody,
    SepayApiSyncVirtualAccountsBody,
    SepayBankAccountOutput,
    SepayCreateOrderVaBody,
    SepayOperationRequestBody,
    SepayOperationRequestDecisionBody,
    SepayOperationRequestOutput,
    SepayOperationRequestQuery,
    SepaySyncResultOutput,
    SepaySyncStatusOutput,
    SepayWebhookBody,
    SepayWebhookHeaders,
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
        payment_code: donation.paymentCode ?? null,
        payment_mode: donation.paymentMode ?? 'TRANSFER_CODE',
        payment_expires_at: donation.paymentExpiresAt ?? null,
        message: donation.message,
        evidence_url: donation.evidenceUrl,
        status: donation.status,
        matched_transaction_id: serializeId(donation.matchedTransactionId),
        matched_at: donation.matchedAt ?? null,
        sepay_bank_account_id:
            donation.sepayOrderPayment?.sepayBankAccount?.sepayAccountId ??
            donation.sepayBankAccount?.sepayAccountId ??
            null,
        verified_by: serializeId(donation.verifiedBy),
        verified_at: donation.verifiedAt,
        reject_reason: donation.rejectReason,
        created_at: donation.createdAt,
        updated_at: donation.updatedAt,
        ingest_state:
            donation.status === 'MATCHED' && donation.verifiedAt == null
                ? 'matched_pending_verification'
                : donation.status === 'PENDING'
                    ? 'pending_webhook'
                    : donation.status.toLowerCase(),
        provider_references: donation.sepayOrderPayment
            ? {
                sepay_order_id: donation.sepayOrderPayment.sepayOrderId,
                sepay_bank_account_id:
                    donation.sepayOrderPayment.sepayBankAccount.sepayAccountId,
                sepay_virtual_account_id:
                    donation.sepayOrderPayment.sepayVirtualAccount?.sepayVaId ??
                    null,
            }
            : donation.sepayBankAccount
                ? {
                    sepay_order_id: null,
                    sepay_bank_account_id: donation.sepayBankAccount.sepayAccountId,
                    sepay_virtual_account_id: null,
                }
                : null,
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
        ingest_source: transaction.ingestSource ?? 'WEBHOOK',
        sepay_account_id:
            transaction.sepayBankAccount?.sepayAccountId ??
            transaction.sepayAccountId ??
            null,
        sepay_va_id:
            transaction.sepayVirtualAccount?.sepayVaId ??
            transaction.sepayVaId ??
            null,
        sepay_order_code: transaction.sepayOrderCode ?? null,
        reference_number: transaction.referenceNumber ?? null,
        webhook_success:
            transaction.webhookSuccess === null ||
            transaction.webhookSuccess === undefined
                ? null
                : Boolean(transaction.webhookSuccess),
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

const sepaySignaturePrefix = 'sha256='
const sepayWebhookMaxSkewSeconds = 300
const sepayTransactionSyncJobType = 'SEPAY_SYNC_TRANSACTIONS'
const sepayBankAccountSyncJobType = 'SEPAY_SYNC_BANK_ACCOUNTS'
const sepayVirtualAccountSyncJobType = 'SEPAY_SYNC_VIRTUAL_ACCOUNTS'

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
    if (body.sepay_bank_account_id !== undefined)
        nextConfig.sepay_bank_account_id = body.sepay_bank_account_id
    if (body.sepay_mode !== undefined) nextConfig.sepay_mode = body.sepay_mode
    if (body.sepay_va_prefix !== undefined)
        nextConfig.sepay_va_prefix = body.sepay_va_prefix

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

    if (config.sepay_enabled) {
        if (!String(config.sepay_bank_account_id ?? '').trim()) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                'Thiếu SePay bank account id chuẩn API v2'
            )
        }

        if (getSepayMode(config.sepay_mode) === 'ORDER_VA' && !config.sepay_enabled) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                'ORDER_VA yêu cầu bật SePay'
            )
        }
    }
}

const requireSepayOperator = (payload?: Principal) => {
    const operator = requireOperator(payload)
    if (!['DOANTRUONG', 'LCD', 'CLB'].includes(operator.role ?? '')) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ CLB, LCD hoặc Đoàn trường được vận hành tích hợp SePay'
        )
    }

    return operator
}

const isSchoolWideSepayOperator = (operator: Principal) =>
    operator.role === 'DOANTRUONG'

const getScopedOrganizationId = (operator: Principal) => {
    if (isSchoolWideSepayOperator(operator)) {
        return null
    }
    if (!operator.organizationId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Không xác định được phạm vi đơn vị của tài khoản hiện tại'
        )
    }
    return BigInt(operator.organizationId)
}

const assertSepayAccountScope = async (args: {
    operator: Principal
    sepayBankAccountId: bigint
}) => {
    if (isSchoolWideSepayOperator(args.operator)) {
        return
    }

    const organizationId = getScopedOrganizationId(args.operator)
    if (!organizationId) {
        return
    }

    const inScope = await fundraisingRepository.isSepayAccountMappedToOrganization({
        sepayBankAccountId: args.sepayBankAccountId,
        organizationId,
    })
    if (!inScope) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Không có quyền thao tác SePay account ngoài phạm vi đơn vị'
        )
    }
}

const serializeSepayOperationRequest = (
    item: any
): SepayOperationRequestOutput => ({
    id: serializeId(item.id)!,
    organization_id: serializeId(item.organizationId)!,
    requester_id: serializeId(item.requesterId)!,
    requester_role: item.requesterRole,
    request_type: item.requestType,
    status: item.status,
    sepay_bank_account_id: item.sepayBankAccount?.sepayAccountId ?? null,
    campaign_id: serializeId(item.campaignId),
    module_id: serializeId(item.moduleId),
    donation_id: serializeId(item.donationId),
    note: item.note ?? null,
    decision_note: item.decisionNote ?? null,
    decided_by: serializeId(item.decidedBy),
    decided_at: item.decidedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
})

const getSepayMode = (configValue: unknown) =>
    String(configValue ?? 'TRANSFER_CODE').toUpperCase() === 'ORDER_VA'
        ? 'ORDER_VA'
        : 'TRANSFER_CODE'

const serializeSepayBankAccount = (account: any): SepayBankAccountOutput => ({
    id: serializeId(account.id)!,
    sepay_account_id: account.sepayAccountId,
    account_holder_name: account.accountHolderName,
    account_number: account.accountNumber,
    accumulated:
        account.accumulated === null || account.accumulated === undefined
            ? null
            : Number(account.accumulated),
    last_transaction: account.lastTransaction ?? null,
    label: account.label ?? null,
    active: Boolean(account.active),
    bank_short_name: account.bankShortName ?? null,
    bank_full_name: account.bankFullName ?? null,
    bank_code: account.bankCode ?? null,
    api_mode: account.apiMode,
    metadata_json: account.metadataJson ?? null,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
})

const toDateOrNull = (value: unknown) => {
    if (!value) {
        return null
    }

    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? null : date
}

const toBoolean = (value: unknown) => {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value === 'boolean') {
        return value
    }
    return String(value) === '1' || String(value).toLowerCase() === 'true'
}

const normalizeSepayTransactionPayload = (body: SepayWebhookBody) => {
    const content = body.content
        ? String(body.content)
        : body.description
            ? String(body.description)
            : null

    return {
        providerTransactionId: String(
            body.transaction_id ??
            body.id ??
            body.gateway_transaction_id ??
            body.referenceCode ??
            ''
        ),
        amount: Number(body.amount ?? body.transferAmount ?? 0),
        content,
        accountNo: body.account_number
            ? String(body.account_number)
            : body.accountNumber
                ? String(body.accountNumber)
                : null,
        transactionTime: new Date(
            body.transaction_time ??
            body.created_at ??
            body.transactionDate ??
            Date.now()
        ),
        sepayAccountId: body.bank_account_id ? String(body.bank_account_id) : null,
        sepayVaId: body.va_id ? String(body.va_id) : null,
        sepayOrderCode: body.code ? String(body.code) : null,
        referenceNumber: body.referenceCode ? String(body.referenceCode) : null,
        webhookSuccess: toBoolean(body.webhook_success),
        moduleId: body.module_id ? BigInt(body.module_id) : null,
        campaignId: body.campaign_id ? BigInt(body.campaign_id) : null,
    }
}

const ensureSepayApiEnabled = () => {
    if (!appConfig.sepay.apiEnabled || !appConfig.sepay.apiToken) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'SePay API chưa được cấu hình hoặc chưa bật'
        )
    }
}

const findSepayBankAccountOrThrow = async (sepayAccountId: string) => {
    const account = await fundraisingRepository.findSepayBankAccountBySepayId(
        sepayAccountId
    )

    if (!account) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy tài khoản SePay đã đồng bộ'
        )
    }

    return account
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

const resolveMatchedDonation = async (args: {
    transaction: {
        id: bigint
        content?: string | null
        sepayOrderCode?: string | null
        sepayVaId?: string | null
    }
    amount: number
    moduleId: bigint | null
}) => {
    if (args.transaction.sepayOrderCode) {
        const orderPayment =
            await fundraisingRepository.findSepayOrderPaymentByOrderCode(
                args.transaction.sepayOrderCode
            )
        if (
            orderPayment?.donation &&
            orderPayment.donation.status === 'PENDING' &&
            Number(orderPayment.donation.amount) === args.amount &&
            !orderPayment.donation.matchedTransactionId
        ) {
            return orderPayment.donation
        }
    }

    const content = args.transaction.content ? String(args.transaction.content) : null
    if (content) {
        const codeMatch = content.match(/BKV-\d+/i)
        if (codeMatch) {
            const paymentCode = codeMatch[0]
            const donationByCode = await fundraisingRepository.findDonationByPaymentCode(
                paymentCode
            )
            if (
                donationByCode &&
                donationByCode.status === 'PENDING' &&
                Number(donationByCode.amount) === args.amount &&
                !donationByCode.matchedTransactionId
            ) {
                return donationByCode
            }
        }
    }

    if (args.moduleId) {
        return fundraisingRepository.findPendingDonationMatch({
            moduleId: args.moduleId,
            amount: args.amount,
        })
    }

    return null
}

const ingestSepayTransaction = async (args: {
    body: SepayWebhookBody
    ingestSource: 'WEBHOOK' | 'API_PULL'
}) => {
    const normalized = normalizeSepayTransactionPayload(args.body)
    if (!normalized.providerTransactionId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Missing provider_transaction_id')
    }

    let sepayBankAccountRefId: bigint | null = null
    if (normalized.sepayAccountId) {
        const sepayBankAccount =
            await fundraisingRepository.findSepayBankAccountBySepayId(
                normalized.sepayAccountId
            )
        sepayBankAccountRefId = sepayBankAccount?.id ?? null
    }

    let sepayVirtualAccountRefId: bigint | null = null
    if (normalized.sepayVaId) {
        const virtualAccount =
            await fundraisingRepository.findSepayVirtualAccountBySepayId(
                normalized.sepayVaId
            )
        sepayVirtualAccountRefId = virtualAccount?.id ?? null
    }

    const transaction = await fundraisingRepository.upsertPaymentTransaction({
        provider: 'SEPAY',
        providerTransactionId: normalized.providerTransactionId,
        amount: normalized.amount,
        content: normalized.content,
        accountNo: normalized.accountNo,
        transactionTime: normalized.transactionTime,
        rawPayload: args.body,
        ingestSource: args.ingestSource,
        sepayAccountId: normalized.sepayAccountId,
        sepayVaId: normalized.sepayVaId,
        sepayOrderCode: normalized.sepayOrderCode,
        referenceNumber: normalized.referenceNumber,
        webhookSuccess: normalized.webhookSuccess,
        sepayBankAccountRefId,
        sepayVirtualAccountRefId,
        campaignId: normalized.campaignId,
        moduleId: normalized.moduleId,
    })

    const matchedDonation = await resolveMatchedDonation({
        transaction: {
            id: transaction.id,
            content: transaction.content,
            sepayOrderCode: transaction.sepayOrderCode,
            sepayVaId: transaction.sepayVaId,
        },
        amount: normalized.amount,
        moduleId: normalized.moduleId,
    })

    const updatedTransaction =
        await fundraisingRepository.updatePaymentTransactionMatch({
            id: transaction.id,
            matchStatus: matchedDonation ? 'MATCHED' : 'UNMATCHED',
            matchedDonationId: matchedDonation?.id,
            campaignId: matchedDonation?.campaignId ?? normalized.campaignId,
            moduleId: matchedDonation?.moduleId ?? normalized.moduleId,
        })

    if (matchedDonation) {
        await fundraisingRepository.attachDonationMatch({
            donationId: matchedDonation.id,
            transactionId: updatedTransaction.id,
        })
    }

    return {
        transaction: updatedTransaction,
        matchedDonation,
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

    if (
        config.sepay_enabled &&
        String(config.sepay_bank_account_id ?? '').trim() &&
        module.campaign.organizationId
    ) {
        const sepayAccount = await findSepayBankAccountOrThrow(
            String(config.sepay_bank_account_id).trim()
        )
        await fundraisingRepository.upsertSepayOrganizationScope({
            sepayBankAccountId: sepayAccount.id,
            organizationId: module.campaign.organizationId,
            source: 'MODULE_CONFIG',
            metadataJson: {
                module_id: moduleIdRaw,
                updated_by: operator.userId,
            },
        })
    }

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
    const paymentMode = getSepayMode(config.sepay_mode)
    let sepayBankAccountRefId: bigint | null = null
    let sepayBankAccount: any = null

    if (config.sepay_enabled && String(config.sepay_bank_account_id ?? '').trim()) {
        sepayBankAccount = await findSepayBankAccountOrThrow(
            String(config.sepay_bank_account_id).trim()
        )
        sepayBankAccountRefId = sepayBankAccount.id
    }

    const donation = await fundraisingRepository.createDonation({
        campaignId: module.campaignId,
        moduleId,
        studentId: BigInt(userId),
        donorName: body.donor_name ?? 'Sinh viên ẩn danh',
        amount: body.amount,
        paymentMode,
        sepayBankAccountRefId,
        message: body.message ?? null,
        evidenceUrl: body.evidence_url ?? null,
    })

    // Generate payment_code and expires_at, persist to donation record
    const paymentCode = `BKV-${String(donation.id)}`
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 60 minutes TTL

    await fundraisingRepository.updateDonationPaymentInfo({
        id: donation.id,
        paymentCode,
        paymentExpiresAt: expiresAt,
    })

    // Update in-memory donation object to satisfy callers/mocks without re-fetch
    try {
        // Some implementations return BigInt for id fields; keep original donation object
        ; (donation as any).paymentCode = paymentCode
        ;(donation as any).paymentExpiresAt = expiresAt
        ;(donation as any).paymentMode = paymentMode
        ;(donation as any).sepayBankAccount = sepayBankAccount
    } catch (e) {
        // ignore
    }

    const receiverName = String(config.receiver_name ?? '').trim() || ''
    const bankName = String(config.bank_name ?? '').trim() || ''
    const bankAccountNo = String(config.bank_account_no ?? '').trim() || ''

    let vietqrUrl = bankName && bankAccountNo
        ? generateVietQrUrl(bankName, bankAccountNo, receiverName, (donation as any).amount)
        : null

    let virtualAccount: {
        id?: string | null
        va_number: string
        holder_name: string | null
        amount: number
        expires_at: Date | null
        status?: string | null
    } | null = null
    let sepayOrderId: string | null = null
    let providerQrUrl: string | null = null

    if (paymentMode === 'ORDER_VA') {
        ensureSepayApiEnabled()
        if (!appConfig.sepay.orderVaEnabled && !appConfig.sepay.vaEnabled) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'ORDER_VA chưa được bật trong cấu hình backend'
            )
        }
        if (!sepayBankAccount) {
            throw new ApiError(
                HttpStatus.UNPROCESSABLE_ENTITY,
                'Thiếu ánh xạ SePay bank account cho module gây quỹ'
            )
        }

        const orderResponse = await sepayClient.createOrder(
            sepayBankAccount.sepayAccountId,
            {
                order_code: paymentCode,
                amount: Math.round(body.amount),
                va_prefix: String(config.sepay_va_prefix ?? '').trim() || undefined,
                va_holder_name: body.donor_name ?? 'BKVOLUNTEERS DONOR',
            }
        )
        const orderData = orderResponse.data
        const orderId = String(orderData.id)
        const orderAmount = Number(orderData.amount ?? body.amount)
        const createVaResponse = await sepayClient.createOrderVirtualAccount(
            sepayBankAccount.sepayAccountId,
            orderId,
            {
                amount: orderAmount,
                va_holder_name:
                    String(orderData.va_holder_name ?? body.donor_name ?? '')
                        .trim() || undefined,
                duration: 60 * 60,
            }
        )
        const vaData = createVaResponse.data

        const savedOrderPayment = await fundraisingRepository.upsertSepayOrderPayment({
            moneyDonationId: donation.id,
            sepayBankAccountId: sepayBankAccount.id,
            sepayOrderId: orderId,
            orderCode: String(orderData.order_code ?? paymentCode),
            amount: orderAmount,
            paidAmount: Number(orderData.paid_amount ?? 0),
            status: String(orderData.status ?? 'Pending').toUpperCase(),
            vaPrefix: String(config.sepay_va_prefix ?? '').trim() || null,
            expiresAt: toDateOrNull(vaData.expired_at),
            payloadJson: {
                order: orderData,
                virtual_account: vaData,
            },
        })

        const savedVirtualAccount = await fundraisingRepository.upsertSepayVirtualAccount({
            sepayVaId: String(vaData.id ?? `${orderId}:${vaData.va_number}`),
            sepayBankAccountId: sepayBankAccount.id,
            vaNumber: String(vaData.va_number),
            subHolderName: vaData.va_holder_name
                ? String(vaData.va_holder_name)
                : null,
            label: `ORDER:${paymentCode}`,
            active: String(vaData.status ?? '').toLowerCase() !== 'expired',
            official: true,
            isStatic: false,
            sourceType: 'ORDER',
            metadataJson: vaData,
        })

        await fundraisingRepository.upsertSepayOrderPayment({
            moneyDonationId: donation.id,
            sepayBankAccountId: sepayBankAccount.id,
            sepayVirtualAccountId: savedVirtualAccount.id,
            sepayOrderId: savedOrderPayment.sepayOrderId,
            orderCode: savedOrderPayment.orderCode,
            amount: Number(savedOrderPayment.amount),
            paidAmount: Number(savedOrderPayment.paidAmount),
            status: savedOrderPayment.status,
            vaPrefix: savedOrderPayment.vaPrefix,
            expiresAt: savedOrderPayment.expiresAt,
            payloadJson: savedOrderPayment.payloadJson,
        })

        sepayOrderId = savedOrderPayment.sepayOrderId
        virtualAccount = {
            id: savedVirtualAccount.sepayVaId,
            va_number: savedVirtualAccount.vaNumber,
            holder_name: savedVirtualAccount.subHolderName,
            amount: body.amount,
            expires_at: savedOrderPayment.expiresAt,
            status: savedOrderPayment.status,
        }
        providerQrUrl = generateVietQrUrl(
            sepayBankAccount.bankShortName ?? bankName,
            savedVirtualAccount.vaNumber,
            savedVirtualAccount.subHolderName ?? receiverName,
            body.amount
        )
        vietqrUrl = providerQrUrl
    }

    return {
        ...serializeDonation(donation),
        payment_instruction: {
            receiver_name: receiverName || null,
            bank_name: bankName || null,
            bank_account_no: bankAccountNo || null,
            amount: body.amount,
            currency: String(config.currency ?? 'VND'),
            payment_code: paymentCode,
            transfer_content: paymentCode,
            expires_at: expiresAt,
            vietqr_url: vietqrUrl,
            sepay_order_id: sepayOrderId,
            virtual_account: virtualAccount,
            provider_qr_url: providerQrUrl,
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

export const getDonation = async (idRaw: string, payload?: Principal) => {
    const donationId = BigInt(idRaw)
    const donation = await fundraisingRepository.findDonationById(donationId)

    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Donation not found')
    }

    // Access control: student can only view own donation, operator must have scope
    if (payload?.accountType === 'STUDENT' && payload.userId) {
        if (BigInt(payload.userId) !== donation.studentId) {
            throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền xem donation này')
        }
    } else if (payload?.accountType === 'OPERATOR') {
        const operator = requireOperator(payload)
        assertOperatorScope(operator, donation.module?.campaign.organizationId)
    } else {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Unauthorized')
    }

    const config = getFundraisingConfig(donation.module?.settingsJson)
    const receiverName = String(config.receiver_name ?? '').trim() || ''
    const bankName = String(config.bank_name ?? '').trim() || ''
    const bankAccountNo = String(config.bank_account_no ?? '').trim() || ''

    const vietqrUrl = bankName && bankAccountNo
        ? generateVietQrUrl(bankName, bankAccountNo, receiverName, donation.amount.toNumber())
        : null

    const orderVirtualAccount = donation.sepayOrderPayment?.sepayVirtualAccount
    const providerQrUrl =
        orderVirtualAccount && donation.sepayBankAccount
            ? generateVietQrUrl(
                donation.sepayBankAccount.bankShortName ?? bankName,
                orderVirtualAccount.vaNumber,
                orderVirtualAccount.subHolderName ?? receiverName,
                donation.amount.toNumber()
            )
            : null

    return {
        ...serializeDonation(donation),
        payment_instruction: {
            receiver_name: receiverName || null,
            bank_name: bankName || null,
            bank_account_no: bankAccountNo || null,
            amount: donation.amount,
            currency: String(config.currency ?? 'VND'),
            payment_code: donation.paymentCode ?? null,
            transfer_content: donation.paymentCode ?? null,
            expires_at: donation.paymentExpiresAt ?? null,
            vietqr_url: providerQrUrl ?? vietqrUrl,
            sepay_order_id: donation.sepayOrderPayment?.sepayOrderId ?? null,
            virtual_account: orderVirtualAccount
                ? {
                    id: donation.sepayOrderPayment?.sepayVirtualAccount?.sepayVaId ?? null,
                    va_number: orderVirtualAccount.vaNumber,
                    holder_name: orderVirtualAccount.subHolderName,
                    amount: donation.amount.toNumber(),
                    expires_at: donation.sepayOrderPayment?.expiresAt ?? null,
                    status: donation.sepayOrderPayment?.status ?? null,
                }
                : null,
            provider_qr_url: providerQrUrl,
        },
    }
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

const verifySepayHmacSignature = (
    configuredSecret: string,
    headers: SepayWebhookHeaders
) => {
    if (!headers.signature || !headers.timestamp) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Missing SePay HMAC authentication headers'
        )
    }

    if (!headers.rawBody) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Missing raw webhook body for SePay signature verification'
        )
    }

    const timestamp = Number(headers.timestamp)
    if (!Number.isInteger(timestamp) || timestamp <= 0) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid SePay timestamp')
    }

    const nowInSeconds = Math.floor(Date.now() / 1000)
    if (Math.abs(nowInSeconds - timestamp) > sepayWebhookMaxSkewSeconds) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Expired SePay webhook request')
    }

    const expectedSignature = `${sepaySignaturePrefix}${crypto
        .createHmac('sha256', configuredSecret)
        .update(`${headers.timestamp}.${headers.rawBody}`)
        .digest('hex')}`

    const providedSignature = headers.signature.trim()
    const providedBuffer = Buffer.from(providedSignature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
        providedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid SePay HMAC signature')
    }
}

const verifySepayWebhookAuth = (
    configuredSecret: string | undefined,
    headers: SepayWebhookHeaders
) => {
    if (!configuredSecret) {
        return
    }

    if (headers.signature || headers.timestamp) {
        verifySepayHmacSignature(configuredSecret, headers)
        return
    }

    if (headers.secret === configuredSecret) {
        return
    }

    throw new ApiError(HttpStatus.FORBIDDEN, 'Invalid webhook secret')
}

export const handleSepayWebhook = async (
    body: SepayWebhookBody,
    headers: SepayWebhookHeaders
) => {
    const configuredSecret = process.env.SEPAY_WEBHOOK_SECRET
    verifySepayWebhookAuth(configuredSecret, headers)
    const { transaction, matchedDonation } = await ingestSepayTransaction({
        body,
        ingestSource: 'WEBHOOK',
    })

    return {
        accepted: true,
        transaction_id: serializeId(transaction.id)!,
        match_status: transaction.matchStatus,
        matched_donation_id: serializeId(matchedDonation?.id ?? null),
        raw_payload: body,
    }
}

export const listSepayAccounts = async (
    query: SepayApiSyncAccountsQuery,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    const where: Record<string, unknown> = {}

    if (query.q) {
        where.OR = [
            { accountHolderName: { contains: query.q } },
            { accountNumber: { contains: query.q } },
            { label: { contains: query.q } },
        ]
    }
    if (query.bank_short_name) {
        where.bankShortName = query.bank_short_name
    }
    if (query.active !== undefined) {
        where.active = query.active === '1'
    }

    const scopedOrganizationId = getScopedOrganizationId(operator)
    const items = scopedOrganizationId
        ? await fundraisingRepository.findScopedSepayBankAccounts({
            organizationId: scopedOrganizationId,
            where,
        })
        : await fundraisingRepository.findSepayBankAccounts({ where })
    return items.map((item) => serializeSepayBankAccount(item))
}

export const syncSepayAccounts = async (
    query: SepayApiSyncAccountsQuery,
    payload?: Principal
): Promise<SepaySyncResultOutput> => {
    const operator = requireSepayOperator(payload)
    ensureSepayApiEnabled()
    if (!isSchoolWideSepayOperator(operator)) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ Đoàn trường được đồng bộ toàn bộ danh sách SePay accounts'
        )
    }

    const response = await sepayClient.listBankAccounts({
        q: query.q,
        bank_short_name: query.bank_short_name,
        active: query.active,
        page: query.page,
        per_page: query.per_page ?? 100,
    })

    const items = []
    for (const account of response.data) {
        const scopedOrganizationId = getScopedOrganizationId(operator)
        if (scopedOrganizationId && !isSchoolWideSepayOperator(operator)) {
            const existing = await fundraisingRepository.findSepayBankAccountBySepayId(
                String(account.id)
            )
            if (existing) {
                await assertSepayAccountScope({
                    operator,
                    sepayBankAccountId: existing.id,
                })
            }
        }

        const synced = await fundraisingRepository.upsertSepayBankAccount({
            sepayAccountId: String(account.id),
            accountHolderName: String(account.account_holder_name),
            accountNumber: String(account.account_number),
            accumulated: Number(account.accumulated ?? 0),
            lastTransaction: toDateOrNull(account.last_transaction),
            label: account.label ? String(account.label) : null,
            active: Boolean(Number(account.active ?? 0)),
            bankShortName: account.bank_short_name
                ? String(account.bank_short_name)
                : null,
            bankFullName: account.bank_full_name
                ? String(account.bank_full_name)
                : null,
            bankCode: account.bank_code ? String(account.bank_code) : null,
            apiMode: appConfig.sepay.apiMode,
            metadataJson: account,
        })
        items.push(serializeSepayBankAccount(synced))
    }

    await fundraisingRepository.upsertSepaySyncCursor({
        type: sepayBankAccountSyncJobType,
        cursorValue: null,
        lastSyncedAt: new Date(),
        lastError: null,
        metadataJson: { synced_count: items.length },
    })

    return {
        synced_count: items.length,
        matched_count: 0,
        unmatched_count: 0,
        failed_count: 0,
        items,
        failed: [],
    }
}

export const getSepaySyncStatus = async (
    payload?: Principal
): Promise<SepaySyncStatusOutput> => {
    const operator = requireSepayOperator(payload)
    const scopedOrganizationId = getScopedOrganizationId(operator)
    const scopedAccountCount = scopedOrganizationId
        ? await fundraisingRepository.countSepayBankAccounts({
            organizationScopes: {
                some: {
                    organizationId: scopedOrganizationId,
                },
            },
        })
        : await fundraisingRepository.countSepayBankAccounts()

    const [accountCount, virtualAccountCount, orderPaymentCount, cursors] =
        await Promise.all([
            Promise.resolve(scopedAccountCount),
            fundraisingRepository.countSepayVirtualAccounts(),
            fundraisingRepository.countSepayOrderPayments(),
            fundraisingRepository.findSepaySyncCursors(),
        ])

    return {
        enabled: appConfig.sepay.apiEnabled,
        api_mode: appConfig.sepay.apiMode,
        api_base_url: appConfig.sepay.apiBaseUrl,
        va_enabled: appConfig.sepay.vaEnabled,
        order_va_enabled: appConfig.sepay.orderVaEnabled,
        account_count: accountCount,
        virtual_account_count: virtualAccountCount,
        order_payment_count: orderPaymentCount,
        cursors: cursors.map((item) => ({
            type: item.type,
            sepay_bank_account_id: item.sepayBankAccount?.sepayAccountId ?? null,
            cursor_value: item.cursorValue ?? null,
            last_synced_at: item.lastSyncedAt ?? null,
            last_error: item.lastError ?? null,
        })),
    }
}

export const syncSepayTransactions = async (
    body: SepayApiSyncTransactionsBody,
    payload?: Principal
): Promise<SepaySyncResultOutput> => {
    const operator = requireSepayOperator(payload)
    ensureSepayApiEnabled()
    if (!isSchoolWideSepayOperator(operator) && !body.sepay_bank_account_id) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Vui lòng chỉ định SePay account trong phạm vi đơn vị'
        )
    }

    if (body.sepay_bank_account_id) {
        const account = await findSepayBankAccountOrThrow(body.sepay_bank_account_id)
        await assertSepayAccountScope({
            operator,
            sepayBankAccountId: account.id,
        })
    }

    const response = await sepayClient.listTransactions({
        bank_account_id: body.sepay_bank_account_id,
        transaction_date_from: body.transaction_date_from,
        transaction_date_to: body.transaction_date_to,
        since_id: body.since_id,
        q: body.q,
        per_page: body.per_page ?? 100,
        transfer_type: 'in',
    })

    const items = []
    let matchedCount = 0
    let unmatchedCount = 0

    for (const item of response.data) {
        const webhookBody: SepayWebhookBody = {
            transaction_id: String(item.id),
            transferAmount: Number(item.amount_in ?? 0),
            accountNumber: item.account_number ? String(item.account_number) : undefined,
            content: item.transaction_content
                ? String(item.transaction_content)
                : undefined,
            transactionDate: item.transaction_date
                ? String(item.transaction_date)
                : undefined,
            referenceCode: item.reference_number
                ? String(item.reference_number)
                : undefined,
            code: item.code ? String(item.code) : undefined,
            bank_account_id: item.bank_account_id
                ? String(item.bank_account_id)
                : undefined,
            va_id: item.va_id ? String(item.va_id) : undefined,
            webhook_success: item.webhook_success,
        }
        const result = await ingestSepayTransaction({
            body: webhookBody,
            ingestSource: 'API_PULL',
        })
        if (result.transaction.matchStatus === 'MATCHED') {
            matchedCount += 1
        } else {
            unmatchedCount += 1
        }
        items.push(serializeTransaction(result.transaction))
    }

    if (body.sepay_bank_account_id) {
        const account = await fundraisingRepository.findSepayBankAccountBySepayId(
            body.sepay_bank_account_id
        )
        await fundraisingRepository.upsertSepaySyncCursor({
            type: sepayTransactionSyncJobType,
            sepayBankAccountId: account?.id ?? null,
            cursorValue:
                response.data.length > 0 ? String(response.data[0].id ?? '') : null,
            lastSyncedAt: new Date(),
            lastError: null,
            metadataJson: {
                synced_count: items.length,
            },
        })
    }

    return {
        synced_count: items.length,
        matched_count: matchedCount,
        unmatched_count: unmatchedCount,
        failed_count: 0,
        items,
        failed: [],
    }
}

export const listSepayUnmatchedTransactions = async (payload?: Principal) => {
    const operator = requireSepayOperator(payload)
    const scopedOrganizationId = getScopedOrganizationId(operator)
    const where: any = {
        provider: 'SEPAY',
        matchStatus: 'UNMATCHED',
        ingestSource: 'API_PULL',
    }
    if (scopedOrganizationId) {
        where.OR = [
            { module: { campaign: { organizationId: scopedOrganizationId } } },
            { campaign: { organizationId: scopedOrganizationId } },
        ]
    }
    const [items] = await fundraisingRepository.findPaymentTransactions({
        page: 1,
        limit: 100,
        where,
    })

    return items.map((item) => serializeTransaction(item))
}

export const syncSepayVirtualAccounts = async (
    body: SepayApiSyncVirtualAccountsBody,
    payload?: Principal
): Promise<SepaySyncResultOutput> => {
    const operator = requireSepayOperator(payload)
    ensureSepayApiEnabled()
    if (!isSchoolWideSepayOperator(operator) && !body.sepay_bank_account_id) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Vui lòng chỉ định SePay account trong phạm vi đơn vị'
        )
    }

    const accounts = body.sepay_bank_account_id
        ? [await findSepayBankAccountOrThrow(body.sepay_bank_account_id)]
        : await fundraisingRepository.findSepayBankAccounts({
            where: { active: true },
        })

    for (const account of accounts) {
        await assertSepayAccountScope({
            operator,
            sepayBankAccountId: account.id,
        })
    }

    const items = []
    for (const account of accounts) {
        const response = await sepayClient.listVirtualAccounts(account.sepayAccountId, {
            q: body.q,
            active: body.active,
            official: body.official,
            static: body.static,
            per_page: body.per_page ?? 100,
        })

        for (const va of response.data) {
            const synced = await fundraisingRepository.upsertSepayVirtualAccount({
                sepayVaId: String(va.id),
                sepayBankAccountId: account.id,
                vaNumber: String(va.va),
                subHolderName: va.sub_holder_name
                    ? String(va.sub_holder_name)
                    : null,
                label: va.label ? String(va.label) : null,
                active: Boolean(Number(va.active ?? 0)),
                official: Boolean(Number(va.official ?? 0)),
                isStatic: Boolean(Number(va.static ?? 0)),
                sourceType: 'DIRECT',
                metadataJson: va,
            })
            items.push({
                sepay_account_id: account.sepayAccountId,
                sepay_va_id: synced.sepayVaId,
                va_number: synced.vaNumber,
            })
        }

        await fundraisingRepository.upsertSepaySyncCursor({
            type: sepayVirtualAccountSyncJobType,
            sepayBankAccountId: account.id,
            cursorValue: null,
            lastSyncedAt: new Date(),
            lastError: null,
            metadataJson: { synced_count: items.length },
        })
    }

    return {
        synced_count: items.length,
        matched_count: 0,
        unmatched_count: 0,
        failed_count: 0,
        items,
        failed: [],
    }
}

export const createOrderVaForDonation = async (
    body: SepayCreateOrderVaBody,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    ensureSepayApiEnabled()

    const donation = await fundraisingRepository.findDonationById(BigInt(body.donation_id))
    if (!donation) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Donation not found')
    }

    assertOperatorScope(operator, donation.module?.campaign.organizationId)

    const moduleConfig = getFundraisingConfig(donation.module?.settingsJson)
    if (getSepayMode(moduleConfig.sepay_mode) !== 'ORDER_VA') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Donation này không thuộc module ORDER_VA'
        )
    }

    const existing = await fundraisingRepository.findSepayOrderPaymentByDonationId(
        donation.id
    )
    if (existing) {
        return {
            donation_id: serializeId(donation.id)!,
            sepay_order_id: existing.sepayOrderId,
            order_code: existing.orderCode,
            status: existing.status,
        }
    }

    const sepayBankAccount = await findSepayBankAccountOrThrow(
        String(moduleConfig.sepay_bank_account_id ?? '')
    )
    const orderCode = donation.paymentCode ?? `BKV-${donation.id.toString()}`
    const orderResponse = await sepayClient.createOrder(
        sepayBankAccount.sepayAccountId,
        {
            order_code: orderCode,
            amount: Math.round(Number(donation.amount)),
            va_prefix: String(moduleConfig.sepay_va_prefix ?? '').trim() || undefined,
            va_holder_name: donation.donorName,
        }
    )
    const orderData = orderResponse.data
    const createVaResponse = await sepayClient.createOrderVirtualAccount(
        sepayBankAccount.sepayAccountId,
        String(orderData.id),
        {
            amount: Number(orderData.amount ?? donation.amount),
            va_holder_name: donation.donorName,
            duration: 60 * 60,
        }
    )
    const vaData = createVaResponse.data
    const virtualAccount = await fundraisingRepository.upsertSepayVirtualAccount({
        sepayVaId: String(vaData.id ?? `${orderData.id}:${vaData.va_number}`),
        sepayBankAccountId: sepayBankAccount.id,
        vaNumber: String(vaData.va_number),
        subHolderName: vaData.va_holder_name ? String(vaData.va_holder_name) : null,
        label: `ORDER:${orderCode}`,
        active: true,
        official: true,
        isStatic: false,
        sourceType: 'ORDER',
        metadataJson: vaData,
    })
    const saved = await fundraisingRepository.upsertSepayOrderPayment({
        moneyDonationId: donation.id,
        sepayBankAccountId: sepayBankAccount.id,
        sepayVirtualAccountId: virtualAccount.id,
        sepayOrderId: String(orderData.id),
        orderCode,
        amount: Number(orderData.amount ?? donation.amount),
        paidAmount: Number(orderData.paid_amount ?? 0),
        status: String(orderData.status ?? 'Pending').toUpperCase(),
        vaPrefix: String(moduleConfig.sepay_va_prefix ?? '').trim() || null,
        providerQrUrl: generateVietQrUrl(
            sepayBankAccount.bankShortName ?? '',
            virtualAccount.vaNumber,
            virtualAccount.subHolderName ?? donation.donorName,
            Number(donation.amount)
        ),
        expiresAt: toDateOrNull(vaData.expired_at),
        payloadJson: {
            order: orderData,
            virtual_account: vaData,
        },
    })

    return {
        donation_id: serializeId(donation.id)!,
        sepay_order_id: saved.sepayOrderId,
        order_code: saved.orderCode,
        status: saved.status,
        virtual_account: virtualAccount.vaNumber,
        provider_qr_url: saved.providerQrUrl,
    }
}

export const createSepayOperationRequest = async (
    body: SepayOperationRequestBody,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    const organizationId = getScopedOrganizationId(operator)
    if (!organizationId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Đoàn trường không cần gửi request, có thể thao tác trực tiếp'
        )
    }

    let sepayBankAccountId: bigint | null = null
    if (body.sepay_bank_account_id) {
        const account = await findSepayBankAccountOrThrow(body.sepay_bank_account_id)
        await assertSepayAccountScope({
            operator,
            sepayBankAccountId: account.id,
        })
        sepayBankAccountId = account.id
    }

    const created = await fundraisingRepository.createSepayOperationRequest({
        organizationId,
        requesterId: BigInt(operator.userId!),
        requesterRole: String(operator.role ?? 'CLB'),
        requestType: body.request_type,
        sepayBankAccountId,
        campaignId: body.campaign_id ? BigInt(body.campaign_id) : null,
        moduleId: body.module_id ? BigInt(body.module_id) : null,
        donationId: body.donation_id ? BigInt(body.donation_id) : null,
        note: body.note ?? null,
    })

    return serializeSepayOperationRequest(created)
}

export const listSepayOperationRequests = async (
    query: SepayOperationRequestQuery,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    const scopedOrganizationId = getScopedOrganizationId(operator)
    const where: any = {}
    if (query.status) {
        where.status = query.status
    }
    if (scopedOrganizationId) {
        where.organizationId = scopedOrganizationId
    }

    const items = await fundraisingRepository.findSepayOperationRequests({ where })
    return items.map((item) => serializeSepayOperationRequest(item))
}

const queueApprovedSepayRequestJob = async (request: any) => {
    const payloadJson = {
        sepay_bank_account_id: request.sepayBankAccount?.sepayAccountId ?? null,
        campaign_id: serializeId(request.campaignId),
        module_id: serializeId(request.moduleId),
        donation_id: serializeId(request.donationId),
    }
    if (request.requestType === 'SYNC_ACCOUNTS') {
        await fundraisingRepository.createBackgroundJob({
            type: sepayBankAccountSyncJobType,
            payloadJson,
        })
        return
    }
    if (request.requestType === 'SYNC_TRANSACTIONS') {
        await fundraisingRepository.createBackgroundJob({
            type: sepayTransactionSyncJobType,
            payloadJson,
        })
        return
    }
    if (request.requestType === 'SYNC_VIRTUAL_ACCOUNTS') {
        await fundraisingRepository.createBackgroundJob({
            type: sepayVirtualAccountSyncJobType,
            payloadJson,
        })
        return
    }
}

export const approveSepayOperationRequest = async (
    idRaw: string,
    body: SepayOperationRequestDecisionBody,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    if (!isSchoolWideSepayOperator(operator)) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ Đoàn trường được phê duyệt SePay request'
        )
    }
    const request = await fundraisingRepository.findSepayOperationRequestById(
        BigInt(idRaw)
    )
    if (!request) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'SePay request not found')
    }
    if (request.status !== 'PENDING') {
        throw new ApiError(HttpStatus.CONFLICT, 'SePay request không còn ở trạng thái chờ duyệt')
    }

    const updated = await fundraisingRepository.decideSepayOperationRequest({
        id: request.id,
        status: 'APPROVED',
        decidedBy: BigInt(operator.userId!),
        decisionNote: body.decision_note ?? null,
    })
    await queueApprovedSepayRequestJob(updated)
    return serializeSepayOperationRequest(updated)
}

export const rejectSepayOperationRequest = async (
    idRaw: string,
    body: SepayOperationRequestDecisionBody,
    payload?: Principal
) => {
    const operator = requireSepayOperator(payload)
    if (!isSchoolWideSepayOperator(operator)) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ Đoàn trường được từ chối SePay request'
        )
    }
    const request = await fundraisingRepository.findSepayOperationRequestById(
        BigInt(idRaw)
    )
    if (!request) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'SePay request not found')
    }
    if (request.status !== 'PENDING') {
        throw new ApiError(HttpStatus.CONFLICT, 'SePay request không còn ở trạng thái chờ duyệt')
    }

    const updated = await fundraisingRepository.decideSepayOperationRequest({
        id: request.id,
        status: 'REJECTED',
        decidedBy: BigInt(operator.userId!),
        decisionNote: body.decision_note ?? null,
    })
    return serializeSepayOperationRequest(updated)
}

export const processBackgroundJob = async (jobIdRaw: string | bigint) => {
    const jobId = typeof jobIdRaw === 'bigint' ? jobIdRaw : BigInt(jobIdRaw)
    const job = await fundraisingRepository.findBackgroundJobById(jobId)
    if (!job) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Background job not found')
    }
    if (!job.type.startsWith('SEPAY_')) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ hỗ trợ xử lý job SePay trong fundraising service'
        )
    }
    if (!['PENDING', 'FAILED'].includes(job.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Job không ở trạng thái có thể xử lý'
        )
    }

    await fundraisingRepository.markBackgroundJobRunning(job.id)

    try {
        const payloadJson = (job.payloadJson ?? {}) as Record<string, unknown>
        let result: unknown

        if (job.type === sepayBankAccountSyncJobType) {
            result = await syncSepayAccounts(
                {
                    q: payloadJson.q ? String(payloadJson.q) : undefined,
                    bank_short_name: payloadJson.bank_short_name
                        ? String(payloadJson.bank_short_name)
                        : undefined,
                    active: payloadJson.active ? String(payloadJson.active) as '0' | '1' : undefined,
                },
                {
                    accountType: 'OPERATOR',
                    userId: '0',
                    role: 'DOANTRUONG',
                }
            )
        } else if (job.type === sepayTransactionSyncJobType) {
            result = await syncSepayTransactions(
                {
                    sepay_bank_account_id: payloadJson.sepay_bank_account_id
                        ? String(payloadJson.sepay_bank_account_id)
                        : undefined,
                    transaction_date_from: payloadJson.transaction_date_from
                        ? String(payloadJson.transaction_date_from)
                        : undefined,
                    transaction_date_to: payloadJson.transaction_date_to
                        ? String(payloadJson.transaction_date_to)
                        : undefined,
                    since_id: payloadJson.since_id
                        ? String(payloadJson.since_id)
                        : undefined,
                },
                {
                    accountType: 'OPERATOR',
                    userId: '0',
                    role: 'DOANTRUONG',
                }
            )
        } else if (job.type === sepayVirtualAccountSyncJobType) {
            result = await syncSepayVirtualAccounts(
                {
                    sepay_bank_account_id: payloadJson.sepay_bank_account_id
                        ? String(payloadJson.sepay_bank_account_id)
                        : undefined,
                },
                {
                    accountType: 'OPERATOR',
                    userId: '0',
                    role: 'DOANTRUONG',
                }
            )
        } else {
            throw new ApiError(HttpStatus.CONFLICT, 'SePay job type không hỗ trợ')
        }

        await fundraisingRepository.markBackgroundJobCompleted(job.id)
        return {
            id: serializeId(job.id)!,
            type: job.type,
            status: 'COMPLETED',
            result,
        }
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'SePay sync job failed'
        await fundraisingRepository.markBackgroundJobFailed(job.id, message)
        throw error
    }
}

export const retryBackgroundJob = async (jobIdRaw: string | bigint) => {
    const jobId = typeof jobIdRaw === 'bigint' ? jobIdRaw : BigInt(jobIdRaw)
    const job = await fundraisingRepository.findBackgroundJobById(jobId)
    if (!job) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Background job not found')
    }
    if (job.status !== 'FAILED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể retry job đang FAILED'
        )
    }
    await fundraisingRepository.resetBackgroundJobForRetry(job.id)
    return processBackgroundJob(job.id)
}

export const processDueBackgroundJobs = async (args?: {
    type?: string
    limit?: number
}) => {
    const jobs = await fundraisingRepository.findProcessableBackgroundJobs({
        type: args?.type,
        limit: args?.limit,
    })

    const processed = []
    const failed = []

    for (const job of jobs) {
        if (!job.type.startsWith('SEPAY_')) {
            continue
        }
        try {
            processed.push(await processBackgroundJob(job.id))
        } catch (error) {
            failed.push({
                id: serializeId(job.id)!,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    return {
        queued: jobs.filter((item) => item.type.startsWith('SEPAY_')).length,
        processed_count: processed.length,
        failed_count: failed.length,
        items: processed,
        failed,
    }
}

export const exportDonationsAsCsv = async (
    moduleIdRaw: string,
    payload?: Principal
): Promise<string> => {
    const operator = requireOperator(payload)
    const moduleId = BigInt(moduleIdRaw)
    
    const module = await fundraisingRepository.findModuleBaseById(moduleId)
    if (!module || !isFundraisingModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const [items] = await fundraisingRepository.findDonations({
        page: 1,
        limit: 50000,
        where: { moduleId }
    })

    const headers = [
        'ID',
        'Tên người đóng góp',
        'Số tiền (VND)',
        'Mã thanh toán',
        'Trạng thái',
        'Ngày đóng góp',
        'Ghi chú'
    ]

    const escapeCsv = (str: string | null | undefined) => {
        if (!str) return '""'
        return `"${String(str).replace(/"/g, '""')}"`
    }

    const rows = items.map(item => [
        item.id.toString(),
        escapeCsv(item.donorName),
        item.amount.toString(),
        escapeCsv(item.paymentCode),
        escapeCsv(item.status),
        escapeCsv(item.createdAt.toISOString()),
        escapeCsv(item.message)
    ].join(','))

    return [headers.join(','), ...rows].join('\n')
}
