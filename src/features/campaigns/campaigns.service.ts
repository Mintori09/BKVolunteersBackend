import { ReviewCommentScopeType, ReviewStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as catalogService from 'src/features/catalog/catalog.service'
import {
    mapLegacyModuleTypeToDb,
    mapLegacyScopeToDb,
} from 'src/features/catalog/catalog.helpers'
import type { UserRole } from 'src/features/auth/types'

type CampaignFilters = {
    q?: string
    status?: string
    module_type?: string
    page?: number
    limit?: number
}

type ApprovalAction = 'pre-approve' | 'approve' | 'request-revision' | 'reject'

type ManagerActor = {
    userId: string
    role: Exclude<UserRole, 'SINHVIEN'>
    managerId: string
    facultyId: number | null
    managedClubId: string | null
}

const getManagerAccountByUserId = async (userId: string) => {
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

    const manager = await getManagerAccountByUserId(userId)

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
        'Ban khong duoc phep thao tac voi chien dich nay'
    )
}

const getEditableCampaign = async (campaignId: string) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id: campaignId,
            deletedAt: null,
        },
        include: {
            reviewRequests: {
                orderBy: {
                    submittedAt: 'desc',
                },
            },
            modules: true,
        },
    })

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
    }

    return campaign
}

const getLatestReviewRequest = async (campaignId: string) => {
    return prismaClient.campaignReviewRequest.findFirst({
        where: {
            campaignId,
        },
        orderBy: {
            submittedAt: 'desc',
        },
    })
}

const notifyBoard = async (
    title: string,
    message: string,
    targetId?: string
) => {
    const boardManagers = await prismaClient.managerAccount.findMany({
        where: {
            user: {
                role: 'DOANTRUONG',
                deletedAt: null,
            },
        },
        select: {
            id: true,
        },
    })

    if (boardManagers.length === 0) {
        return
    }

    await prismaClient.managerNotification.createMany({
        data: boardManagers.map((manager) => ({
            managerId: manager.id,
            type: 'CAMPAIGN',
            title,
            message,
            targetType: targetId ? 'CAMPAIGN' : null,
            targetId: targetId ?? null,
        })),
        skipDuplicates: true,
    })
}

const notifyCampaignCreator = async (
    campaignId: string,
    title: string,
    message: string
) => {
    const campaign = await prismaClient.campaign.findUnique({
        where: {
            id: campaignId,
        },
        select: {
            organizerManagerId: true,
        },
    })

    if (!campaign) {
        return
    }

    await prismaClient.managerNotification.create({
        data: {
            managerId: campaign.organizerManagerId,
            type: 'CAMPAIGN',
            title,
            message,
            targetType: 'CAMPAIGN',
            targetId: campaignId,
        },
    })
}

export const resetManagedCampaignStore = async () => {
    await prismaClient.campaign.deleteMany({
        where: {
            OR: [
                {
                    title: {
                        startsWith: 'Chien dich cong dong moi',
                    },
                },
                {
                    title: {
                        in: [
                            'Chien dich can duyet',
                            'Chien dich he tinh nguyen 2026',
                        ],
                    },
                },
            ],
        },
    })
}

export const listManagedCampaigns = async (filters: CampaignFilters) =>
    catalogService.listManagedCampaigns(filters)

export const getManagedCampaignById = async (campaignId: string) =>
    catalogService.getManagedCampaignById(campaignId)

export const findManagedCampaignBySlug = async (slug: string) =>
    catalogService.getPublicCampaignBySlug(slug)

export const findManagedCampaignByModuleId = async (moduleId: string) => {
    const module = await prismaClient.campaignModule.findUnique({
        where: {
            id: moduleId,
        },
        select: {
            campaignId: true,
        },
    })

    if (!module) {
        return null
    }

    return catalogService.getManagedCampaignById(module.campaignId)
}

export const createManagedCampaign = async (
    payload: {
        title: string
        summary: string
        description?: string
        scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC'
        start_at: string
        end_at: string
    },
    actor: {
        userId: string
        role: UserRole
    }
) => {
    if (actor.role === 'SINHVIEN') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Sinh vien khong duoc phep tao chien dich'
        )
    }

    const manager = await getManagerAccountByUserId(actor.userId)
    const startAt = new Date(payload.start_at)
    const endAt = new Date(payload.end_at)

    if (
        !payload.title ||
        !payload.summary ||
        Number.isNaN(startAt.getTime()) ||
        Number.isNaN(endAt.getTime())
    ) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Thong tin chien dich khong hop le'
        )
    }

    const created = await prismaClient.campaign.create({
        data: {
            title: payload.title,
            organizerManagerId: manager.id,
            organizerType:
                actor.role === 'CLB'
                    ? 'CLB'
                    : actor.role === 'LCD'
                      ? 'LCD'
                      : 'DOANTRUONG',
            facultyId: manager.facultyId,
            clubId: manager.managedClubId,
            shortDescription: payload.summary,
            overallObjective: payload.description ?? null,
            beneficiaryDescription: payload.description ?? null,
            campaignStartAt: startAt,
            campaignEndAt: endAt,
            participationScopeType: mapLegacyScopeToDb(payload.scope_type),
            status: 'DRAFT',
        },
    })

    await prismaClient.campaignStatusHistory.create({
        data: {
            campaignId: created.id,
            fromStatus: null,
            toStatus: 'DRAFT',
            changedById: manager.id,
            note: 'Tạo chiến dịch mới',
        },
    })

    return {
        id: created.id,
    }
}

export const createCampaignModule = async (
    campaignId: string,
    payload: {
        type: 'fundraising' | 'item_donation' | 'event' | 'volunteer'
        title: string
        description?: string
        start_at: string
        end_at: string
        settings: Record<string, unknown>
    },
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const managerActor = await getManagerActor(actor.userId, actor.role)
    const campaign = await getEditableCampaign(campaignId)
    assertCanManageCampaign(managerActor, campaign)

    const createdModule = await prismaClient.campaignModule.create({
        data: {
            campaignId,
            moduleType: mapLegacyModuleTypeToDb(payload.type),
            title: payload.title,
            shortDescription: payload.description ?? null,
            displayOrder:
                (await prismaClient.campaignModule.count({
                    where: {
                        campaignId,
                    },
                })) + 1,
            moduleStartAt: new Date(payload.start_at),
            moduleEndAt: new Date(payload.end_at),
            registrationStartAt: new Date(payload.start_at),
            registrationEndAt: new Date(payload.end_at),
            status: 'DRAFT',
            visibilityStatus: payload.type === 'event' ? 'PUBLIC' : 'INTERNAL',
        },
    })

    if (payload.type === 'event') {
        await prismaClient.eventModuleConfig.create({
            data: {
                moduleId: createdModule.id,
                eventFormat: 'OFFLINE',
                eventLocation:
                    typeof payload.settings.location === 'string'
                        ? payload.settings.location
                        : null,
                maxAttendees:
                    typeof payload.settings.quota === 'number'
                        ? payload.settings.quota
                        : typeof payload.settings.quota === 'string'
                          ? Number(payload.settings.quota)
                          : null,
                eventAgenda:
                    typeof payload.settings.agenda === 'string'
                        ? payload.settings.agenda
                        : null,
                checkinEnabled:
                    typeof payload.settings.checkin_required === 'boolean'
                        ? payload.settings.checkin_required
                        : true,
            },
        })
    } else if (payload.type === 'fundraising') {
        const paymentAccount =
            await prismaClient.organizerPaymentAccount.findFirstOrThrow({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    isDefault: 'desc',
                },
            })

        await prismaClient.fundraisingModuleConfig.create({
            data: {
                moduleId: createdModule.id,
                fundraisingGoalAmount:
                    typeof payload.settings.target_amount === 'number'
                        ? payload.settings.target_amount
                        : 0,
                minimumContributionAmount: 10000,
                paymentMethodType: 'MANUAL_TRANSFER',
                organizerPaymentAccountId: paymentAccount.id,
                displayPublicProgress: true,
            },
        })
    } else if (payload.type === 'item_donation') {
        await prismaClient.itemDonationModuleConfig.create({
            data: {
                moduleId: createdModule.id,
                receiveLocation:
                    typeof payload.settings.receive_location === 'string'
                        ? payload.settings.receive_location
                        : 'Văn phòng Đoàn trường',
                receiverContactName:
                    typeof payload.settings.receiver_name === 'string'
                        ? payload.settings.receiver_name
                        : 'Ban tổ chức',
                receiverContactPhone:
                    typeof payload.settings.receiver_phone === 'string'
                        ? payload.settings.receiver_phone
                        : null,
                handoverConfirmationMethod: 'MANUAL_CONFIRM',
                allowPreRegistration: true,
            },
        })
    } else {
        await prismaClient.volunteerModuleConfig.create({
            data: {
                moduleId: createdModule.id,
                jobDescription:
                    typeof payload.settings.job_description === 'string'
                        ? payload.settings.job_description
                        : null,
                requiredQuantity:
                    typeof payload.settings.required_quantity === 'number'
                        ? payload.settings.required_quantity
                        : typeof payload.settings.required_quantity === 'string'
                          ? Number(payload.settings.required_quantity)
                          : null,
                requirementsText:
                    typeof payload.settings.requirements === 'string'
                        ? payload.settings.requirements
                        : null,
                activityLocation:
                    typeof payload.settings.location === 'string'
                        ? payload.settings.location
                        : null,
                autoCertificateEnabled: true,
                checkinRequired: true,
            },
        })
    }

    return {
        id: createdModule.id,
    }
}

export const submitCampaignReview = async (
    campaignId: string,
    actorUserId: string,
    actorRole: UserRole
) => {
    const actor = await getManagerActor(actorUserId, actorRole)
    const campaign = await getEditableCampaign(campaignId)
    assertCanManageCampaign(actor, campaign)

    if (!['DRAFT', 'REVISION_REQUIRED'].includes(campaign.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chi duoc gui duyet chien dich dang o trang thai nhap hoac yeu cau chinh sua'
        )
    }

    await prismaClient.$transaction(async (tx) => {
        await tx.campaign.update({
            where: {
                id: campaignId,
            },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
            },
        })

        await tx.campaignReviewRequest.create({
            data: {
                campaignId,
                submittedById: actor.managerId,
                reviewStatus: 'SUBMITTED',
            },
        })

        await tx.campaignStatusHistory.create({
            data: {
                campaignId,
                fromStatus: campaign.status,
                toStatus: 'SUBMITTED',
                changedById: actor.managerId,
                note: 'Gửi chiến dịch để duyệt',
            },
        })
    })

    await notifyBoard(
        'Có chiến dịch mới chờ duyệt',
        `Chiến dịch ${campaign.title} vừa được gửi duyệt`,
        campaignId
    )

    return {
        id: campaignId,
        from_status: campaign.status,
        to_status: 'SUBMITTED',
    }
}

export const addApprovalComment = async (
    campaignId: string,
    payload: {
        body: string
        visibility?: 'INTERNAL' | 'PUBLIC'
        module_id?: string
    },
    actorUserId: string
) => {
    const manager = await getManagerAccountByUserId(actorUserId)
    const latestReviewRequest = await getLatestReviewRequest(campaignId)

    if (!latestReviewRequest) {
        return null
    }

    const created = await prismaClient.campaignReviewComment.create({
        data: {
            reviewRequestId: latestReviewRequest.id,
            scopeType: payload.module_id
                ? ReviewCommentScopeType.MODULE
                : ReviewCommentScopeType.CAMPAIGN,
            moduleId: payload.module_id ?? null,
            commentText: payload.body,
            authorId: manager.id,
        },
    })

    return {
        id: created.id,
    }
}

export const transitionApproval = async (
    campaignId: string,
    action: ApprovalAction,
    actorRole: UserRole,
    actorUserId: string,
    reason?: string
) => {
    if (actorRole !== 'DOANTRUONG') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chi Doan truong moi duoc phe duyet ho so chien dich'
        )
    }

    const manager = await getManagerAccountByUserId(actorUserId)
    const campaign = await getEditableCampaign(campaignId)
    const latestReviewRequest = await getLatestReviewRequest(campaignId)

    if (!latestReviewRequest) {
        return null
    }

    const transitionMap: Record<
        ApprovalAction,
        {
            allowedStatuses: ReviewStatus[]
            nextReviewStatus: ReviewStatus
            nextCampaignStatus?: 'APPROVED' | 'REVISION_REQUIRED' | 'CANCELLED'
            defaultMessage: string
        }
    > = {
        'pre-approve': {
            allowedStatuses: ['SUBMITTED'],
            nextReviewStatus: 'PRE_APPROVED',
            defaultMessage: 'Hồ sơ đã đạt yêu cầu sơ duyệt',
        },
        approve: {
            allowedStatuses: ['PRE_APPROVED'],
            nextReviewStatus: 'FINAL_APPROVED',
            nextCampaignStatus: 'APPROVED',
            defaultMessage: 'Chiến dịch đã được phê duyệt',
        },
        'request-revision': {
            allowedStatuses: ['SUBMITTED', 'PRE_APPROVED'],
            nextReviewStatus: 'REVISION_REQUIRED',
            nextCampaignStatus: 'REVISION_REQUIRED',
            defaultMessage: 'Yêu cầu đơn vị bổ sung hồ sơ',
        },
        reject: {
            allowedStatuses: ['SUBMITTED', 'PRE_APPROVED'],
            nextReviewStatus: 'REJECTED',
            nextCampaignStatus: 'CANCELLED',
            defaultMessage: 'Hồ sơ bị từ chối',
        },
    }

    const config = transitionMap[action]

    if (!config.allowedStatuses.includes(latestReviewRequest.reviewStatus)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Trang thai chien dich khong hop le cho thao tac phe duyet nay'
        )
    }

    await prismaClient.$transaction(async (tx) => {
        await tx.campaignReviewRequest.update({
            where: {
                id: latestReviewRequest.id,
            },
            data: {
                reviewStatus: config.nextReviewStatus,
                currentReviewerId: manager.id,
                reviewedAt: new Date(),
            },
        })

        await tx.campaignReviewComment.create({
            data: {
                reviewRequestId: latestReviewRequest.id,
                scopeType: 'CAMPAIGN',
                commentText: reason?.trim() || config.defaultMessage,
                authorId: manager.id,
            },
        })

        if (config.nextCampaignStatus) {
            await tx.campaign.update({
                where: {
                    id: campaignId,
                },
                data: {
                    status: config.nextCampaignStatus,
                },
            })

            await tx.campaignStatusHistory.create({
                data: {
                    campaignId,
                    fromStatus: campaign.status,
                    toStatus: config.nextCampaignStatus,
                    changedById: manager.id,
                    note: reason?.trim() || config.defaultMessage,
                },
            })
        }
    })

    await notifyCampaignCreator(
        campaignId,
        'Cập nhật trạng thái duyệt chiến dịch',
        reason?.trim() || config.defaultMessage
    )

    return {
        campaign_id: campaignId,
        from_status:
            action === 'pre-approve'
                ? 'SUBMITTED'
                : action === 'approve'
                  ? 'PRE_APPROVED'
                  : campaign.status,
        to_status:
            action === 'pre-approve'
                ? 'PRE_APPROVED'
                : action === 'approve'
                  ? 'APPROVED'
                  : action === 'request-revision'
                    ? 'REVISION_REQUIRED'
                    : 'REJECTED',
    }
}

export const publishCampaign = async (
    campaignId: string,
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const managerActor = await getManagerActor(actor.userId, actor.role)
    const campaign = await getEditableCampaign(campaignId)
    assertCanManageCampaign(managerActor, campaign)

    if (campaign.status !== 'APPROVED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chi duoc cong khai chien dich sau khi Doan truong phe duyet'
        )
    }

    await prismaClient.campaign.update({
        where: {
            id: campaignId,
        },
        data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
        },
    })

    return {
        id: campaignId,
        status: 'PUBLISHED',
    }
}

export const deleteCampaign = async (
    campaignId: string,
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const managerActor = await getManagerActor(actor.userId, actor.role)
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id: campaignId,
            deletedAt: null,
        },
    })

    if (!campaign) {
        return false
    }

    assertCanManageCampaign(managerActor, campaign)

    await prismaClient.campaign.update({
        where: {
            id: campaignId,
        },
        data: {
            deletedAt: new Date(),
        },
    })

    return true
}

export const listManagedApprovalQueue = async (filters: CampaignFilters) =>
    catalogService.getApprovalQueue(filters)

export const getManagedApprovalCampaignDetail = async (campaignId: string) =>
    catalogService.getApprovalCampaignDetail(campaignId)
