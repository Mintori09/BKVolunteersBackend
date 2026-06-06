import * as authService from 'src/features/auth/auth.service'
import type { UserRole } from 'src/features/auth/types'
import { catalogCampaigns } from 'src/features/catalog/catalog.data'
import {
    initialFundraisingDonations,
    initialFundraisingTransactions,
} from './fundraising.data'
import {
    FundraisingDonationRecord,
    FundraisingTransactionRecord,
} from './fundraising.types'

let donationCounter = 300
let transactionCounter = 300
let fundraisingDonationStore: FundraisingDonationRecord[] =
    initialFundraisingDonations.map((item) => ({
        ...item,
        payment_instruction: item.payment_instruction
            ? { ...item.payment_instruction }
            : null,
    }))
let fundraisingTransactionStore = initialFundraisingTransactions.map((item) => ({
    ...item,
}))

const cloneDonation = (
    item: FundraisingDonationRecord
): FundraisingDonationRecord => ({
    ...item,
    payment_instruction: item.payment_instruction
        ? { ...item.payment_instruction }
        : null,
})

const cloneTransaction = (
    item: FundraisingTransactionRecord
): FundraisingTransactionRecord => ({
    ...item,
})

const findFundraisingModuleEntry = (moduleId: string) => {
    for (const campaign of catalogCampaigns) {
        const module = campaign.modules.find(
            (item) => item.id === moduleId && item.type === 'fundraising'
        )

        if (module) {
            return { campaign, module }
        }
    }

    return null
}

const fundraisingConfigStore = new Map(
    catalogCampaigns.flatMap((campaign) =>
        campaign.modules
            .filter((module) => module.type === 'fundraising')
            .map((module) => [module.id, { ...module.settings }])
    )
)

const findDonation = (donationId: string) =>
    fundraisingDonationStore.find((item) => item.id === donationId) ?? null

const findTransaction = (transactionId: string) =>
    fundraisingTransactionStore.find((item) => item.id === transactionId) ?? null

const decorateTransaction = (item: FundraisingTransactionRecord) => {
    const matchedDonation = item.matched_donation_id
        ? fundraisingDonationStore.find(
              (donation) => donation.id === item.matched_donation_id
          ) ?? null
        : null

    return {
        ...cloneTransaction(item),
        matched_donation: matchedDonation
            ? {
                  id: matchedDonation.id,
                  donor_name: matchedDonation.donor_name,
                  amount: matchedDonation.amount,
                  status: matchedDonation.status,
                  created_at: matchedDonation.created_at,
              }
            : null,
    }
}

const paginate = <T>(items: T[], page?: number, limit?: number) => {
    const safePage =
        page && Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit =
        limit && Number.isFinite(limit) && limit > 0
            ? Math.min(100, Math.floor(limit))
            : 20
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / safeLimit))
    const start = (safePage - 1) * safeLimit

    return {
        items: items.slice(start, start + safeLimit),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages,
        },
    }
}

export const resetFundraisingStore = () => {
    donationCounter = 300
    transactionCounter = 300
    fundraisingDonationStore = initialFundraisingDonations.map(cloneDonation)
    fundraisingTransactionStore = initialFundraisingTransactions.map(
        cloneTransaction
    )
    fundraisingConfigStore.clear()

    catalogCampaigns.forEach((campaign) => {
        campaign.modules
            .filter((module) => module.type === 'fundraising')
            .forEach((module) => {
                fundraisingConfigStore.set(module.id, { ...module.settings })
            })
    })
}

export const getFundraisingModule = (moduleId: string) => {
    const entry = findFundraisingModuleEntry(moduleId)

    if (!entry) {
        return null
    }

    const totalRaised = fundraisingDonationStore
        .filter(
            (item) => item.module_id === moduleId && item.status === 'VERIFIED'
        )
        .reduce((total, item) => total + item.amount, 0)

    return {
        id: entry.module.id,
        campaign_id: entry.campaign.id,
        type: entry.module.type,
        title: entry.module.title,
        status: entry.module.status,
        settings_json: {
            ...(fundraisingConfigStore.get(moduleId) ?? entry.module.settings),
        },
        total_raised: totalRaised,
        campaign: {
            id: entry.campaign.id,
            title: entry.campaign.title,
            slug: entry.campaign.slug,
            status: entry.campaign.status,
        },
    }
}

export const updateFundraisingConfig = (
    moduleId: string,
    payload: {
        target_amount?: number
        receiver_name?: string
        bank_name?: string
        bank_account_no?: string
        currency?: string
        sepay_enabled?: boolean
        sepay_account_id?: string | null
    }
) => {
    const entry = findFundraisingModuleEntry(moduleId)

    if (!entry) {
        return null
    }

    const current = {
        ...(fundraisingConfigStore.get(moduleId) ?? entry.module.settings),
    }
    const next = {
        ...current,
        ...payload,
    }

    fundraisingConfigStore.set(moduleId, next)

    return {
        module_id: moduleId,
        config: { ...next },
        status: entry.module.status,
    }
}

export const createMoneyDonation = async (input: {
    moduleId: string
    userId: string
    role?: UserRole
    amount: number
    donor_name?: string
    message?: string
}) => {
    const entry = findFundraisingModuleEntry(input.moduleId)

    if (!entry) {
        return null
    }

    const user = await authService.getUserById(input.userId, input.role)
    const donationId = `donation-${donationCounter++}`
    const paymentCode = `DON-2026-${donationCounter}`
    const now = new Date().toISOString()
    const donation: FundraisingDonationRecord = {
        id: donationId,
        module_id: input.moduleId,
        campaign_id: entry.campaign.id,
        student_id: input.userId,
        donor_name:
            input.donor_name?.trim() ||
            `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
            'Nguoi ung ho BK',
        amount: input.amount,
        status: 'PENDING',
        matched_transaction_id: null,
        message: input.message?.trim() || null,
        evidence_url: null,
        created_at: now,
        verified_at: null,
        reject_reason: null,
        payment_instruction: {
            payment_code: paymentCode,
            transfer_content: `BKV ${paymentCode}`,
            expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            vietqr_url: null,
            amount: input.amount,
            currency: 'VND',
        },
    }

    fundraisingDonationStore = [donation, ...fundraisingDonationStore]

    return {
        id: donation.id,
        status: donation.status,
    }
}

export const getDonationById = (donationId: string) => {
    const donation = findDonation(donationId)

    if (!donation) {
        return null
    }

    return cloneDonation(donation)
}

export const listFundraisingDonations = (params: {
    moduleId: string
    status?: string
    q?: string
    from?: string
    to?: string
    page?: number
    limit?: number
}) => {
    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()
    const fromTime = params.from ? new Date(params.from).getTime() : null
    const toTime = params.to ? new Date(params.to).getTime() : null

    const filtered = fundraisingDonationStore
        .filter((item) => item.module_id === params.moduleId)
        .filter((item) => !params.status || item.status === params.status)
        .filter((item) => {
            if (!normalizedQuery) {
                return true
            }

            return [
                item.donor_name,
                item.message ?? '',
                item.id,
                item.matched_transaction_id ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery)
        })
        .filter((item) => {
            const createdAt = new Date(item.created_at).getTime()

            if (fromTime && Number.isFinite(fromTime) && createdAt < fromTime) {
                return false
            }

            if (toTime && Number.isFinite(toTime) && createdAt > toTime) {
                return false
            }

            return true
        })
        .sort(
            (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
        )
        .map(cloneDonation)

    return paginate(filtered, params.page, params.limit)
}

export const verifyFundraisingDonation = (
    donationId: string,
    payload?: { transaction_id?: string; note?: string }
) => {
    const existingDonation = findDonation(donationId)

    if (!existingDonation) {
        return null
    }

    const transactionId =
        payload?.transaction_id?.trim() || existingDonation.matched_transaction_id || null

    if (transactionId) {
        fundraisingTransactionStore = fundraisingTransactionStore.map((item) => {
            if (item.id === transactionId) {
                return {
                    ...item,
                    match_status: 'MATCHED',
                    matched_donation_id: donationId,
                }
            }

            if (item.matched_donation_id === donationId && item.id !== transactionId) {
                return {
                    ...item,
                    match_status: 'UNMATCHED',
                    matched_donation_id: null,
                }
            }

            return item
        })
    }

    const nextDonation: FundraisingDonationRecord = {
        ...existingDonation,
        status: 'VERIFIED',
        matched_transaction_id: transactionId,
        verified_at: new Date().toISOString(),
        reject_reason: null,
        message: payload?.note?.trim() || existingDonation.message || null,
    }

    fundraisingDonationStore = fundraisingDonationStore.map((item) =>
        item.id === donationId ? nextDonation : item
    )

    return {
        id: nextDonation.id,
        status: nextDonation.status,
    }
}

export const listFundraisingTransactions = (params: {
    match_status?: 'MATCHED' | 'UNMATCHED'
    module_id?: string
    campaign_id?: string
    q?: string
    from?: string
    to?: string
    page?: number
    limit?: number
}) => {
    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()
    const fromTime = params.from ? new Date(params.from).getTime() : null
    const toTime = params.to ? new Date(params.to).getTime() : null

    const filtered = fundraisingTransactionStore
        .filter((item) => !params.match_status || item.match_status === params.match_status)
        .filter((item) => !params.module_id || item.module_id === params.module_id)
        .filter((item) => !params.campaign_id || item.campaign_id === params.campaign_id)
        .filter((item) => {
            if (!normalizedQuery) {
                return true
            }

            return [
                item.provider_transaction_id,
                item.content ?? '',
                item.account_no ?? '',
                item.id,
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery)
        })
        .filter((item) => {
            const transactionTime = new Date(item.transaction_time).getTime()

            if (fromTime && Number.isFinite(fromTime) && transactionTime < fromTime) {
                return false
            }

            if (toTime && Number.isFinite(toTime) && transactionTime > toTime) {
                return false
            }

            return true
        })
        .sort(
            (left, right) =>
                new Date(right.transaction_time).getTime() -
                new Date(left.transaction_time).getTime()
        )
        .map(decorateTransaction)

    return paginate(filtered, params.page, params.limit)
}

export const attachFundraisingTransaction = (
    transactionId: string,
    donationId: string
) => {
    const donation = findDonation(donationId)
    const transaction = findTransaction(transactionId)

    if (!donation || !transaction) {
        return null
    }

    fundraisingTransactionStore = fundraisingTransactionStore.map((item) => {
        if (item.id === transactionId) {
            return {
                ...item,
                match_status: 'MATCHED',
                matched_donation_id: donationId,
            }
        }

        if (item.matched_donation_id === donationId && item.id !== transactionId) {
            return {
                ...item,
                match_status: 'UNMATCHED',
                matched_donation_id: null,
            }
        }

        return item
    })

    fundraisingDonationStore = fundraisingDonationStore.map((item) =>
        item.id === donationId
            ? {
                  ...item,
                  status: item.status === 'VERIFIED' ? 'VERIFIED' : 'MATCHED',
                  matched_transaction_id: transactionId,
              }
            : item
    )

    return decorateTransaction(
        fundraisingTransactionStore.find((item) => item.id === transactionId) ?? transaction
    )
}

export const unmatchFundraisingTransaction = (transactionId: string) => {
    const transaction = findTransaction(transactionId)

    if (!transaction) {
        return null
    }

    const matchedDonationId = transaction.matched_donation_id ?? null

    fundraisingTransactionStore = fundraisingTransactionStore.map((item) =>
        item.id === transactionId
            ? {
                  ...item,
                  match_status: 'UNMATCHED',
                  matched_donation_id: null,
              }
            : item
    )

    if (matchedDonationId) {
        fundraisingDonationStore = fundraisingDonationStore.map((item) =>
            item.id === matchedDonationId
                ? {
                      ...item,
                      matched_transaction_id: null,
                      status: item.status === 'MATCHED' ? 'PENDING' : item.status,
                  }
                : item
        )
    }

    const updated = fundraisingTransactionStore.find((item) => item.id === transactionId)
    return updated ? decorateTransaction(updated) : null
}

export const rejectFundraisingDonation = (donationId: string, reason?: string) => {
    const donation = findDonation(donationId)

    if (!donation) {
        return null
    }

    if (donation.matched_transaction_id) {
        fundraisingTransactionStore = fundraisingTransactionStore.map((item) =>
            item.id === donation.matched_transaction_id
                ? {
                      ...item,
                      match_status: 'UNMATCHED',
                      matched_donation_id: null,
                  }
                : item
        )
    }

    const nextDonation: FundraisingDonationRecord = {
        ...donation,
        status: 'REJECTED',
        matched_transaction_id: null,
        reject_reason: reason?.trim() || 'Can kiem tra lai sao ke hoac minh chung',
    }

    fundraisingDonationStore = fundraisingDonationStore.map((item) =>
        item.id === donationId ? nextDonation : item
    )

    return {
        id: nextDonation.id,
        status: nextDonation.status,
    }
}
