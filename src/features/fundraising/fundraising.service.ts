import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { mapContributionStatusToLegacy } from 'src/features/catalog/catalog.helpers'
import type { UserRole } from 'src/features/auth/types'

const fundraisingModuleInclude = {
    campaign: true,
    fundraisingConfig: {
        include: {
            paymentAccount: {
                include: {
                    providerConfigs: true,
                },
            },
            qrFile: true,
        },
    },
    moneyContributions: {
        include: {
            module: true,
            student: {
                include: {
                    user: true,
                },
            },
            providerTransactions: true,
        },
        orderBy: {
            createdAt: 'desc' as const,
        },
    },
} as const

type FundraisingModuleRecord = Prisma.PromiseReturnType<
    typeof findFundraisingModule
>
type FundraisingDonationRecord =
    NonNullable<FundraisingModuleRecord>['moneyContributions'][number]

type ManagerActor = {
    userId: string
    role: Exclude<UserRole, 'SINHVIEN'>
    managerId: string
    facultyId: number | null
    managedClubId: string | null
}

const findFundraisingModule = async (moduleId: string) =>
    prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            moduleType: 'FUNDRAISING_MONEY',
        },
        include: fundraisingModuleInclude,
    })

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

const toNumber = (value: { toString(): string } | number | null | undefined) =>
    value == null ? 0 : Number(value.toString())

const getStudentByUserId = async (userId: string) => {
    const student = await prismaClient.student.findUnique({
        where: {
            userId,
        },
        include: {
            user: true,
        },
    })

    if (!student) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Khong tim thay ho so sinh vien'
        )
    }

    return student
}

const getManagerByUserId = async (userId: string) => {
    const manager = await prismaClient.managerAccount.findUnique({
        where: {
            userId,
        },
    })

    if (!manager) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Khong tim thay tai khoan quan ly'
        )
    }

    return manager
}

const getManagerActor = async (
    userId: string,
    role: UserRole
): Promise<ManagerActor> => {
    if (role === 'SINHVIEN') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Sinh vien khong duoc phep thuc hien thao tac nay'
        )
    }

    const manager = await getManagerByUserId(userId)

    return {
        userId,
        role,
        managerId: manager.id,
        facultyId: manager.facultyId,
        managedClubId: manager.managedClubId ?? null,
    }
}

const assertCanManageCampaign = (
    actor: ManagerActor,
    campaign: {
        organizerManagerId: string
        facultyId: number | null
        clubId: string | null
    }
) => {
    if (actor.role === 'DOANTRUONG') {
        return
    }

    if (campaign.organizerManagerId === actor.managerId) {
        return
    }

    if (
        actor.role === 'CLB' &&
        actor.managedClubId &&
        campaign.clubId === actor.managedClubId
    ) {
        return
    }

    if (
        actor.role === 'LCD' &&
        actor.facultyId &&
        campaign.facultyId === actor.facultyId
    ) {
        return
    }

    throw new ApiError(
        HttpStatus.FORBIDDEN,
        'Ban khong duoc phep thao tac voi hang muc gay quy nay'
    )
}

const mapDonation = (item: FundraisingDonationRecord) => ({
    id: item.id,
    module_id: item.moduleId,
    campaign_id: item.module.campaignId,
    student_id: item.student.userId,
    donor_name: item.student.fullName,
    amount: toNumber(item.amount),
    status: mapContributionStatusToLegacy(
        item.contributionStatus,
        Boolean(item.paymentProviderTransactionId)
    ),
    matched_transaction_id: item.paymentProviderTransactionId ?? null,
    message: item.rejectionReason ?? null,
    evidence_url: item.proofFileId ?? null,
    created_at: item.createdAt.toISOString(),
    verified_at: item.verifiedAt?.toISOString() ?? null,
    reject_reason: item.rejectionReason ?? null,
    payment_instruction: {
        payment_code: item.id.toUpperCase(),
        transfer_content: `Ủng hộ ${item.id}`,
        expires_at: null,
        vietqr_url: null,
        amount: toNumber(item.amount),
        currency: 'VND',
    },
})

const decorateTransaction = async (
    item: Awaited<
        ReturnType<typeof prismaClient.moneyContributionTransaction.findMany>
    >[number]
) => {
    const matchedDonation = item.realtimeStatementMatched
        ? await prismaClient.moneyContribution.findUnique({
              where: {
                  id: item.moneyContributionId,
              },
              include: {
                  student: true,
              },
          })
        : null

    return {
        id: item.id,
        provider: item.providerName,
        provider_transaction_id:
            item.providerTransactionId ?? item.providerOrderCode ?? item.id,
        campaign_id: null,
        module_id: matchedDonation?.moduleId ?? null,
        amount: matchedDonation ? toNumber(matchedDonation.amount) : 0,
        content: item.providerStatus ?? null,
        account_no: null,
        transaction_time: item.createdAt.toISOString(),
        match_status: item.realtimeStatementMatched ? 'MATCHED' : 'UNMATCHED',
        matched_donation_id: item.realtimeStatementMatched
            ? item.moneyContributionId
            : null,
        matched_donation: matchedDonation
            ? {
                  id: matchedDonation.id,
                  donor_name: matchedDonation.student.fullName,
                  amount: toNumber(matchedDonation.amount),
                  status: mapContributionStatusToLegacy(
                      matchedDonation.contributionStatus,
                      Boolean(matchedDonation.paymentProviderTransactionId)
                  ),
                  created_at: matchedDonation.createdAt.toISOString(),
              }
            : null,
    }
}

export const resetFundraisingStore = async () => {
    await prismaClient.moneyContribution.deleteMany({
        where: {
            moduleId: 'module-fundraising-2',
            id: {
                notIn: ['donation-201'],
            },
        },
    })

    await prismaClient.moneyContribution.update({
        where: {
            id: 'donation-201',
        },
        data: {
            contributionStatus: 'PENDING',
            paymentProviderTransactionId: null,
            verifiedAt: null,
            rejectionReason: 'Ủng hộ học bổng đầu năm',
        },
    })

    await prismaClient.moneyContributionTransaction.update({
        where: {
            id: 'tx-fund-201',
        },
        data: {
            moneyContributionId: 'donation-201',
            realtimeStatementMatched: false,
            providerStatus: 'Chờ đối soát',
        },
    })
}

export const getFundraisingModule = async (moduleId: string) => {
    const entry = await findFundraisingModule(moduleId)

    if (!entry) {
        return null
    }

    const totalRaised = entry.moneyContributions
        .filter((item) => item.contributionStatus === 'VERIFIED')
        .reduce((total, item) => total + toNumber(item.amount), 0)

    return {
        id: entry.id,
        campaign_id: entry.campaignId,
        type: 'fundraising',
        title: entry.title,
        status: entry.status,
        settings_json: {
            target_amount: toNumber(
                entry.fundraisingConfig?.fundraisingGoalAmount
            ),
            receiver_name:
                entry.fundraisingConfig?.paymentAccount.accountHolderName ??
                null,
            bank_name: entry.fundraisingConfig?.paymentAccount.bankName ?? null,
            bank_account_no:
                entry.fundraisingConfig?.paymentAccount.accountNumber ?? null,
            currency: 'VND',
            sepay_enabled:
                entry.fundraisingConfig?.paymentAccount.providerConfigs.some(
                    (config) => config.isActive
                ),
            sepay_account_id:
                entry.fundraisingConfig?.paymentAccount.providerConfigs[0]
                    ?.id ?? null,
        },
        total_raised: totalRaised,
        campaign: {
            id: entry.campaign.id,
            title: entry.campaign.title,
            slug: entry.campaign.title,
            status: entry.campaign.status,
        },
    }
}

export const updateFundraisingConfig = async (
    moduleId: string,
    payload: {
        target_amount?: number
        receiver_name?: string
        bank_name?: string
        bank_account_no?: string
        currency?: string
        sepay_enabled?: boolean
        sepay_account_id?: string | null
    },
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const entry = await findFundraisingModule(moduleId)

    if (!entry || !entry.fundraisingConfig) {
        return null
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, entry.campaign)

    const fundraisingConfig = entry.fundraisingConfig

    await prismaClient.$transaction(async (tx) => {
        await tx.fundraisingModuleConfig.update({
            where: {
                moduleId,
            },
            data: {
                ...(payload.target_amount !== undefined
                    ? { fundraisingGoalAmount: payload.target_amount }
                    : {}),
            },
        })

        await tx.organizerPaymentAccount.update({
            where: {
                id: fundraisingConfig.organizerPaymentAccountId,
            },
            data: {
                ...(payload.receiver_name !== undefined
                    ? { accountHolderName: payload.receiver_name }
                    : {}),
                ...(payload.bank_name !== undefined
                    ? { bankName: payload.bank_name }
                    : {}),
                ...(payload.bank_account_no !== undefined
                    ? { accountNumber: payload.bank_account_no }
                    : {}),
            },
        })

        if (fundraisingConfig.paymentAccount.providerConfigs[0]) {
            await tx.paymentProviderConfig.update({
                where: {
                    id: fundraisingConfig.paymentAccount.providerConfigs[0].id,
                },
                data: {
                    ...(payload.sepay_enabled !== undefined
                        ? { isActive: payload.sepay_enabled }
                        : {}),
                },
            })
        }
    })

    return getFundraisingModule(moduleId).then((module) =>
        module
            ? {
                  module_id: module.id,
                  config: { ...module.settings_json },
                  status: module.status,
              }
            : null
    )
}

export const createMoneyDonation = async (input: {
    moduleId: string
    userId: string
    role?: UserRole
    amount: number
    donor_name?: string
    message?: string
}) => {
    const entry = await findFundraisingModule(input.moduleId)

    if (!entry) {
        return null
    }

    const student = await getStudentByUserId(input.userId)
    const created = await prismaClient.moneyContribution.create({
        data: {
            moduleId: input.moduleId,
            studentId: student.id,
            amount: input.amount,
            contributionStatus: 'PENDING',
            paymentMethodType: 'MANUAL_TRANSFER',
            rejectionReason: input.message?.trim() || null,
        },
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: student.id,
            type: 'CONTRIBUTION',
            title: 'Đã ghi nhận đóng góp',
            message: `Khoản ủng hộ ${input.amount.toLocaleString('vi-VN')} VND đang chờ xác minh`,
            targetType: 'CONTRIBUTION',
            targetId: created.id,
        },
    })

    return {
        id: created.id,
        status: 'PENDING',
    }
}

export const getDonationById = async (
    donationId: string,
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const donation = await prismaClient.moneyContribution.findUnique({
        where: {
            id: donationId,
        },
        include: {
            student: {
                include: {
                    user: true,
                },
            },
            module: {
                include: {
                    campaign: true,
                },
            },
            providerTransactions: true,
        },
    })

    if (!donation) {
        return null
    }

    if (actor.role === 'SINHVIEN') {
        if (donation.student.userId !== actor.userId) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Ban khong duoc phep xem chi tiet dong gop nay'
            )
        }
    } else {
        const managerActor = await getManagerActor(actor.userId, actor.role)
        assertCanManageCampaign(managerActor, donation.module.campaign)
    }

    return mapDonation({
        ...donation,
        module: donation.module,
    } as FundraisingDonationRecord)
}

export const listFundraisingDonations = async (params: {
    moduleId: string
    status?: string
    q?: string
    from?: string
    to?: string
    page?: number
    limit?: number
    actor: {
        userId: string
        role: UserRole
    }
}) => {
    const module = await findFundraisingModule(params.moduleId)

    if (!module) {
        return paginate([], params.page, params.limit)
    }

    const managerActor = await getManagerActor(
        params.actor.userId,
        params.actor.role
    )
    assertCanManageCampaign(managerActor, module.campaign)

    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()
    const fromTime = params.from ? new Date(params.from).getTime() : null
    const toTime = params.to ? new Date(params.to).getTime() : null

    const filtered = module.moneyContributions
        .map((item) => ({
            ...item,
            module,
        }))
        .map(mapDonation)
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

    return paginate(filtered, params.page, params.limit)
}

export const verifyFundraisingDonation = async (
    donationId: string,
    payload?: {
        transaction_id?: string
        note?: string
        actor?: {
            userId: string
            role: UserRole
        }
    }
) => {
    const donation = await prismaClient.moneyContribution.findUnique({
        where: {
            id: donationId,
        },
        include: {
            student: true,
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!donation) {
        return null
    }

    if (!payload?.actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(
        payload.actor.userId,
        payload.actor.role
    )
    assertCanManageCampaign(managerActor, donation.module.campaign)

    await prismaClient.$transaction(async (tx) => {
        await tx.moneyContribution.update({
            where: {
                id: donationId,
            },
            data: {
                contributionStatus: 'VERIFIED',
                verifiedAt: new Date(),
                rejectionReason: payload?.note?.trim() || null,
                ...(payload?.transaction_id
                    ? { paymentProviderTransactionId: payload.transaction_id }
                    : {}),
            },
        })

        if (payload?.transaction_id) {
            await tx.moneyContributionTransaction.update({
                where: {
                    id: payload.transaction_id,
                },
                data: {
                    realtimeStatementMatched: true,
                },
            })
        }
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: donation.studentId,
            type: 'CONTRIBUTION',
            title: 'Đóng góp đã được xác minh',
            message: 'Khoản đóng góp của bạn đã được xác minh thành công',
            targetType: 'CONTRIBUTION',
            targetId: donationId,
        },
    })

    return {
        id: donationId,
        status: 'VERIFIED',
    }
}

export const listFundraisingTransactions = async (params: {
    match_status?: 'MATCHED' | 'UNMATCHED'
    module_id?: string
    campaign_id?: string
    q?: string
    from?: string
    to?: string
    page?: number
    limit?: number
    actor: {
        userId: string
        role: UserRole
    }
}) => {
    const managerActor = await getManagerActor(
        params.actor.userId,
        params.actor.role
    )
    const transactions =
        await prismaClient.moneyContributionTransaction.findMany({
            where: {
                moneyContribution: {
                    ...(params.module_id ? { moduleId: params.module_id } : {}),
                    ...(params.campaign_id
                        ? {
                              module: {
                                  campaignId: params.campaign_id,
                              },
                          }
                        : {}),
                    ...(managerActor.role === 'DOANTRUONG'
                        ? {}
                        : managerActor.role === 'CLB'
                          ? {
                                module: {
                                    ...(params.campaign_id
                                        ? { campaignId: params.campaign_id }
                                        : {}),
                                    campaign: {
                                        clubId:
                                            managerActor.managedClubId ??
                                            '__forbidden__',
                                    },
                                },
                            }
                          : {
                                module: {
                                    ...(params.campaign_id
                                        ? { campaignId: params.campaign_id }
                                        : {}),
                                    campaign: {
                                        facultyId: managerActor.facultyId ?? -1,
                                    },
                                },
                            }),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()
    const fromTime = params.from ? new Date(params.from).getTime() : null
    const toTime = params.to ? new Date(params.to).getTime() : null

    const decorated = await Promise.all(transactions.map(decorateTransaction))
    const filtered = decorated
        .filter(
            (item) =>
                !params.match_status ||
                item.match_status === params.match_status
        )
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

            if (
                fromTime &&
                Number.isFinite(fromTime) &&
                transactionTime < fromTime
            ) {
                return false
            }

            if (toTime && Number.isFinite(toTime) && transactionTime > toTime) {
                return false
            }

            return true
        })

    return paginate(filtered, params.page, params.limit)
}

export const attachFundraisingTransaction = async (
    transactionId: string,
    donationId: string,
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const [donation, transaction] = await Promise.all([
        prismaClient.moneyContribution.findUnique({
            where: {
                id: donationId,
            },
            include: {
                module: {
                    include: {
                        campaign: true,
                    },
                },
            },
        }),
        prismaClient.moneyContributionTransaction.findUnique({
            where: {
                id: transactionId,
            },
            include: {
                moneyContribution: {
                    include: {
                        module: {
                            include: {
                                campaign: true,
                            },
                        },
                    },
                },
            },
        }),
    ])

    if (!donation || !transaction) {
        return null
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, donation.module.campaign)
    assertCanManageCampaign(
        managerActor,
        transaction.moneyContribution.module.campaign
    )

    await prismaClient.$transaction(async (tx) => {
        await tx.moneyContribution.update({
            where: {
                id: donationId,
            },
            data: {
                paymentProviderTransactionId: transactionId,
            },
        })

        await tx.moneyContributionTransaction.update({
            where: {
                id: transactionId,
            },
            data: {
                moneyContributionId: donationId,
                realtimeStatementMatched: true,
            },
        })
    })

    const updated = await prismaClient.moneyContributionTransaction.findUnique({
        where: {
            id: transactionId,
        },
    })

    return updated ? decorateTransaction(updated) : null
}

export const unmatchFundraisingTransaction = async (
    transactionId: string,
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const transaction =
        await prismaClient.moneyContributionTransaction.findUnique({
            where: {
                id: transactionId,
            },
            include: {
                moneyContribution: {
                    include: {
                        module: {
                            include: {
                                campaign: true,
                            },
                        },
                    },
                },
            },
        })

    if (!transaction) {
        return null
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(
        managerActor,
        transaction.moneyContribution.module.campaign
    )

    await prismaClient.$transaction(async (tx) => {
        await tx.moneyContribution.update({
            where: {
                id: transaction.moneyContributionId,
            },
            data: {
                paymentProviderTransactionId: null,
            },
        })

        await tx.moneyContributionTransaction.update({
            where: {
                id: transactionId,
            },
            data: {
                realtimeStatementMatched: false,
            },
        })
    })

    const updated = await prismaClient.moneyContributionTransaction.findUnique({
        where: {
            id: transactionId,
        },
    })

    return updated ? decorateTransaction(updated) : null
}

export const rejectFundraisingDonation = async (
    donationId: string,
    reason?: string,
    actor?: {
        userId: string
        role: UserRole
    }
) => {
    const donation = await prismaClient.moneyContribution.findUnique({
        where: {
            id: donationId,
        },
        include: {
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!donation) {
        return null
    }

    if (!actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, donation.module.campaign)

    await prismaClient.moneyContribution.update({
        where: {
            id: donationId,
        },
        data: {
            contributionStatus: 'REJECTED',
            paymentProviderTransactionId: null,
            rejectionReason:
                reason?.trim() || 'Can kiem tra lai sao ke hoac minh chung',
        },
    })

    return {
        id: donationId,
        status: 'REJECTED',
    }
}
