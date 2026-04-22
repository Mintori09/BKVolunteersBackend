import {
    CampaignApprovalStatus,
    CampaignPhaseType,
    CampaignPublicationStatus,
    CampaignStatusGroup,
    CertificateDeliveryStatus,
    ContributionStatus,
    ContributionType,
    ManagerRoleType,
    RegistrationStatus,
    type Prisma,
} from '@prisma/client'
import type { JwtPayload } from 'jsonwebtoken'
import { HttpStatus } from 'src/common/constants'
import { prismaClient } from 'src/config'
import * as authService from 'src/features/auth/auth.service'
import type { AuthTokenPayload } from 'src/features/auth/types'
import { ApiError } from 'src/utils/ApiError'
import type {
    ExportWorkspaceReportPayload,
    ManagerWorkspaceResponse,
    ReviewContributionPayload,
    ReviewRegistrationPayload,
    UpdateMembershipStatusPayload,
    WorkspaceActivityItem,
    WorkspaceCampaignItem,
    WorkspaceCertificateItem,
    WorkspaceContributionItem,
    WorkspaceMembershipItem,
    WorkspaceRegistrationItem,
    WorkspaceReportExportResponse,
} from './workspace.types'

type ManagerWithContext = NonNullable<
    Awaited<ReturnType<typeof authService.getManagerById>>
>

type ScopeFilters = {
    campaignWhere: Prisma.CampaignWhereInput
    membershipWhere: Prisma.ClubMembershipWhereInput
    registrationWhere: Prisma.RegistrationWhereInput
    contributionWhere: Prisma.ContributionWhereInput
}

type CampaignStatusHistoryRecord = any
type MembershipRecord = any
type RegistrationRecord = any
type ContributionRecord = any
type CertificateRecord = any

const VOLUNTEER_PHASE_TYPES = new Set<CampaignPhaseType>([
    CampaignPhaseType.VOLUNTEER_RECRUITMENT,
    CampaignPhaseType.FIELD_ACTIVITY,
    CampaignPhaseType.ONLINE_ACTIVITY,
    CampaignPhaseType.BLOOD_DONATION,
])

const requireManagerPayload = (payload?: JwtPayload) => {
    const authPayload = payload as Partial<AuthTokenPayload> | undefined

    if (!authPayload?.userId || authPayload.subjectType !== 'manager') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Only manager accounts can access manager workspace'
        )
    }

    return authPayload as AuthTokenPayload
}

const getManagerOrThrow = async (payload?: JwtPayload) => {
    const authPayload = requireManagerPayload(payload)
    const manager = await authService.getManagerById(authPayload.userId)

    if (!manager) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Manager session is no longer valid'
        )
    }

    authService.ensureManagerActive(manager)
    authService.ensureManagerContext(manager)

    return manager
}

const getScopeFilters = (manager: ManagerWithContext): ScopeFilters => {
    if (manager.roleType === ManagerRoleType.DOANTRUONG_ADMIN) {
        return {
            campaignWhere: {},
            membershipWhere: {},
            registrationWhere: {},
            contributionWhere: {
                contributionType: ContributionType.MONEY,
            },
        }
    }

    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        const facultyId = manager.facultyId as number

        return {
            campaignWhere: {
                OR: [{ facultyId }, { club: { facultyId } }],
            },
            membershipWhere: {
                club: {
                    facultyId,
                },
            },
            registrationWhere: {
                phase: {
                    campaign: {
                        OR: [{ facultyId }, { club: { facultyId } }],
                    },
                },
            },
            contributionWhere: {
                contributionType: ContributionType.MONEY,
                phase: {
                    campaign: {
                        OR: [{ facultyId }, { club: { facultyId } }],
                    },
                },
            },
        }
    }

    const clubId = manager.clubId as string

    return {
        campaignWhere: {
            clubId,
        },
        membershipWhere: {
            clubId,
        },
        registrationWhere: {
            phase: {
                campaign: {
                    clubId,
                },
            },
        },
        contributionWhere: {
            contributionType: ContributionType.MONEY,
            phase: {
                campaign: {
                    clubId,
                },
            },
        },
    }
}

const getManagerScopeName = (manager: ManagerWithContext) => {
    const scope = authService.ensureManagerContext(manager)
    return scope.scopeName
}

const getCampaignScopeName = (campaign: {
    organizerType: string
    faculty?: { name: string } | null
    club?: { name: string } | null
}) => {
    if (campaign.organizerType === 'CLB') {
        return campaign.club?.name ?? 'CLB'
    }

    if (campaign.organizerType === 'LCD') {
        return campaign.faculty?.name ?? 'Lien chi doan'
    }

    return 'Doan truong'
}

const getCampaignSteps = (campaign: {
    title: string
    description: string
    slogan: string | null
    campaignFiles: Array<{ fileType: string }>
    phases: Array<{
        phaseType: CampaignPhaseType
        fundraisingConfig: unknown
        itemDonationConfig: unknown
        volunteerConfig: unknown
        acceptedItems: unknown[]
    }>
}) => {
    const fundraisingPhase = campaign.phases.find(
        (phase) =>
            phase.phaseType === CampaignPhaseType.FUNDRAISING &&
            Boolean(phase.fundraisingConfig)
    )
    const itemDonationPhase = campaign.phases.find(
        (phase) =>
            phase.phaseType === CampaignPhaseType.ITEM_DONATION &&
            Boolean(phase.itemDonationConfig)
    )
    const volunteerPhase = campaign.phases.find(
        (phase) =>
            VOLUNTEER_PHASE_TYPES.has(phase.phaseType) &&
            Boolean(phase.volunteerConfig)
    )
    const hasAttachments = campaign.campaignFiles.some((file) =>
        ['PLAN', 'BUDGET'].includes(file.fileType)
    )

    return {
        basicInfo: Boolean(campaign.title.trim() && campaign.description.trim()),
        fundraising: Boolean(fundraisingPhase),
        itemDonation: Boolean(
            itemDonationPhase ||
                campaign.phases.some((phase) => phase.acceptedItems.length > 0)
        ),
        volunteerRecruitment: Boolean(volunteerPhase),
        attachments: hasAttachments,
        preview: Boolean(
            hasAttachments ||
                fundraisingPhase ||
                itemDonationPhase ||
                volunteerPhase ||
                campaign.slogan
        ),
    }
}

const getCampaignNextAction = (campaign: WorkspaceCampaignItem) => {
    if (campaign.approvalStatus === CampaignApprovalStatus.DRAFT) {
        const missingSteps = Object.entries(campaign.steps)
            .filter(([, completed]) => !completed)
            .map(([key]) => key)

        if (missingSteps.length > 0) {
            return `Hoan tat ${missingSteps.slice(0, 2).join(', ')} truoc khi gui duyet.`
        }

        return 'Ho so da san sang de gui duyet.'
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.SUBMITTED ||
        campaign.approvalStatus === CampaignApprovalStatus.UNDER_PRE_REVIEW ||
        campaign.approvalStatus === CampaignApprovalStatus.PRE_APPROVED ||
        campaign.approvalStatus === CampaignApprovalStatus.UNDER_FINAL_REVIEW
    ) {
        return 'Theo doi qua trinh so duyet va cap nhat neu co yeu cau bo sung.'
    }

    if (campaign.approvalStatus === CampaignApprovalStatus.REVISION_REQUIRED) {
        return 'Bo sung ho so theo phan hoi va gui duyet lai.'
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
        (campaign.publicationStatus === CampaignPublicationStatus.NOT_PUBLIC ||
            campaign.publicationStatus ===
                CampaignPublicationStatus.READY_TO_PUBLISH)
    ) {
        return 'Co the cong khai chien dich khi da san sang mo tiep nhan.'
    }

    if (
        campaign.publicationStatus === CampaignPublicationStatus.REGISTRATION_OPEN
    ) {
        return 'Dang mo dang ky, can theo doi queue tinh nguyen vien va dong gop.'
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.ONGOING) {
        return 'Theo doi tien do thuc hien, check-in va ket qua chien dich.'
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.ENDED) {
        return 'Tong hop bao cao, chung nhan va tai lieu ket thuc chien dich.'
    }

    return 'Theo doi cap nhat moi nhat trong workspace.'
}

const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
    value ? Number(value) : 0

const hoursBetween = (from: Date, to?: Date | null) => {
    if (!to) {
        return 0
    }

    const milliseconds = to.getTime() - from.getTime()
    if (milliseconds <= 0) {
        return 0
    }

    return Math.round((milliseconds / (1000 * 60 * 60)) * 10) / 10
}

const mapCampaign = (
    campaign: any
): WorkspaceCampaignItem => {
    const steps = getCampaignSteps(campaign)
    const fundraisingTarget = campaign.phases.reduce(
        (sum: number, phase: any) =>
            sum + toNumber(phase.fundraisingConfig?.targetAmount),
        0
    )
    const verifiedAmount = campaign.phases.reduce(
        (sum: number, phase: any) =>
            sum +
            phase.contributions.reduce((phaseSum: number, contribution: any) => {
                if (contribution.status !== 'VERIFIED') {
                    return phaseSum
                }

                return phaseSum + toNumber(contribution.amount)
            }, 0),
        0
    )
    const itemCategories = campaign.phases.reduce(
        (sum: number, phase: any) => sum + phase.acceptedItems.length,
        0
    )
    const volunteerSlots = campaign.phases.reduce((sum: number, phase: any) => {
        if (!VOLUNTEER_PHASE_TYPES.has(phase.phaseType)) {
            return sum
        }

        return sum + (phase.volunteerConfig?.maxParticipants ?? 0)
    }, 0)
    const approvedVolunteers = campaign.phases.reduce(
        (sum: number, phase: any) =>
            sum +
            phase.registrations.filter((registration: any) =>
                [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED].includes(
                    registration.status
                )
            ).length,
        0
    )
    const pendingRegistrations = campaign.phases.reduce(
        (sum: number, phase: any) =>
            sum +
            phase.registrations.filter(
                (registration: any) =>
                    registration.status === RegistrationStatus.PENDING
            ).length,
        0
    )
    const needsManualVerification = campaign.phases.reduce(
        (sum: number, phase: any) =>
            sum +
            phase.contributions.filter(
                (contribution: any) => contribution.status === 'PENDING'
            ).length,
        0
    )

    const mappedCampaign: WorkspaceCampaignItem = {
        id: campaign.id,
        title: campaign.title,
        slogan: campaign.slogan,
        summary: campaign.description,
        organizerType: campaign.organizerType,
        scopeName: getCampaignScopeName(campaign),
        facultyId: campaign.facultyId ?? null,
        facultyName: campaign.faculty?.name ?? null,
        clubId: campaign.clubId ?? null,
        clubName: campaign.club?.name ?? null,
        approvalStatus: campaign.approvalStatus,
        publicationStatus: campaign.publicationStatus,
        steps,
        fundraisingTarget,
        verifiedAmount,
        itemCategories,
        volunteerSlots,
        approvedVolunteers,
        pendingRegistrations,
        needsManualVerification,
        updatedAt: campaign.updatedAt,
        nextAction: '',
    }

    mappedCampaign.nextAction = getCampaignNextAction(mappedCampaign)
    return mappedCampaign
}

const mapMembership = (membership: MembershipRecord): WorkspaceMembershipItem => ({
    id: membership.id,
    fullName: membership.student.fullName,
    studentCode: membership.student.mssv,
    facultyName:
        membership.student.faculty?.name ??
        membership.club.faculty?.name ??
        'Unknown faculty',
    requestedAt: membership.createdAt,
    status: membership.status,
    unitRole: membership.club.name,
    clubId: membership.clubId,
    facultyId: membership.club.facultyId ?? null,
    note: membership.note ?? null,
})

const mapRegistration = (
    registration: RegistrationRecord
): WorkspaceRegistrationItem => ({
    id: registration.id,
    campaignId: registration.phase.campaign.id,
    campaignTitle: registration.phase.campaign.title,
    studentName: registration.student.fullName,
    facultyName: registration.student.faculty?.name ?? 'Unknown faculty',
    appliedAt: registration.appliedAt,
    preferredShift: registration.phase.phaseName,
    status: registration.status,
    note: registration.rejectionReason ?? null,
})

const mapContribution = (
    contribution: ContributionRecord
): WorkspaceContributionItem => ({
    id: contribution.id,
    campaignId: contribution.phase.campaign.id,
    campaignTitle: contribution.phase.campaign.title,
    donorName: contribution.student.fullName,
    amount: toNumber(contribution.amount),
    proofCode:
        contribution.proofFile?.originalName ??
        contribution.proofFileId ??
        contribution.id,
    submittedAt: contribution.createdAt,
    status: contribution.status,
})

const mapCertificate = (
    registration: CertificateRecord
): WorkspaceCertificateItem => {
    const latestCertificate = registration.certificates[0]
    const completedHours = registration.checkins.reduce(
        (sum: number, checkin: any) =>
            sum + hoursBetween(checkin.checkedInAt, checkin.checkedOutAt),
        0
    )

    return {
        id: latestCertificate?.id ?? registration.id,
        registrationId: registration.id,
        campaignId: registration.phase.campaign.id,
        campaignTitle: registration.phase.campaign.title,
        studentName: registration.student.fullName,
        completedHours,
        status: !latestCertificate
            ? 'PENDING'
            : latestCertificate.deliveryStatus === CertificateDeliveryStatus.SENT
              ? 'EMAILED'
              : 'GENERATED',
        updatedAt:
            latestCertificate?.emailSentAt ??
            latestCertificate?.issuedAt ??
            registration.appliedAt,
    }
}

const buildActivityLog = (
    campaignHistory: CampaignStatusHistoryRecord[],
    memberships: MembershipRecord[],
    registrations: RegistrationRecord[],
    contributions: ContributionRecord[],
    certificates: CertificateRecord[]
): WorkspaceActivityItem[] => {
    const activity: WorkspaceActivityItem[] = [
        ...campaignHistory.map((item) => ({
            id: `campaign-${item.id}`,
            title: `${item.campaign.title} · ${item.statusGroup}`,
            description:
                item.note ??
                `${item.fromStatus ?? 'N/A'} -> ${item.toStatus}`,
            timestamp: item.createdAt,
            category: 'campaign' as const,
        })),
        ...memberships.map((item) => ({
            id: `membership-${item.id}`,
            title:
                item.status === 'PENDING'
                    ? 'Yeu cau thanh vien moi'
                    : 'Cap nhat thanh vien',
            description: `${item.student.fullName} · ${item.club.name} · ${item.status}`,
            timestamp: item.approvedAt ?? item.createdAt,
            category: 'membership' as const,
        })),
        ...registrations.map((item) => ({
            id: `registration-${item.id}`,
            title: `${item.phase.campaign.title} · dang ky tinh nguyen`,
            description: `${item.student.fullName} · ${item.status}`,
            timestamp: item.reviewedAt ?? item.appliedAt,
            category: 'registration' as const,
        })),
        ...contributions.map((item) => ({
            id: `contribution-${item.id}`,
            title: `${item.phase.campaign.title} · dong gop`,
            description: `${item.student.fullName} · ${item.status}`,
            timestamp: item.verifiedAt ?? item.createdAt,
            category: 'contribution' as const,
        })),
        ...certificates
            .filter((item) => item.certificates.length > 0)
            .map((item) => ({
                id: `certificate-${item.id}`,
                title: `${item.phase.campaign.title} · chung nhan`,
                description: `${item.student.fullName} · ${item.certificates[0]?.deliveryStatus ?? 'PENDING'}`,
                timestamp:
                    item.certificates[0]?.emailSentAt ??
                    item.certificates[0]?.issuedAt ??
                    item.appliedAt,
                category: 'certificate' as const,
            })),
    ]

    return activity
        .sort(
            (left, right) =>
                new Date(right.timestamp).getTime() -
                new Date(left.timestamp).getTime()
        )
        .slice(0, 20)
}

const getPublishStatus = (
    campaign: any
) => {
    if (!campaign) {
        return CampaignPublicationStatus.PUBLISHED
    }

    const now = new Date()
    const hasOpenVolunteerRegistration = campaign.phases.some(
        (phase: any) =>
            VOLUNTEER_PHASE_TYPES.has(phase.phaseType) &&
            Boolean(phase.volunteerConfig) &&
            Boolean(phase.registrationStartAt) &&
            Boolean(phase.registrationEndAt) &&
            phase.registrationStartAt! <= now &&
            phase.registrationEndAt! >= now
    )

    if (hasOpenVolunteerRegistration) {
        return CampaignPublicationStatus.REGISTRATION_OPEN
    }

    const hasOngoingPhase = campaign.phases.some(
        (phase: any) => phase.startAt <= now && phase.endAt >= now
    )

    if (hasOngoingPhase) {
        return CampaignPublicationStatus.ONGOING
    }

    return CampaignPublicationStatus.PUBLISHED
}

const ensureAdminCanApprove = (manager: ManagerWithContext) => {
    if (manager.roleType !== ManagerRoleType.DOANTRUONG_ADMIN) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Only Doan truong managers can approve campaigns'
        )
    }
}

const buildCsv = (
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>
) => {
    const escapeValue = (value: string | number | null | undefined) => {
        const stringValue = value == null ? '' : String(value)

        if (/[\",\\n]/.test(stringValue)) {
            return `\"${stringValue.replace(/\"/g, '\"\"')}\"`
        }

        return stringValue
    }

    return [headers, ...rows]
        .map((row) => row.map((value) => escapeValue(value)).join(','))
        .join('\n')
}

export const getManagerWorkspace = async (
    payload?: JwtPayload
): Promise<ManagerWorkspaceResponse> => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)

    const [
        campaignRecords,
        membershipRecords,
        registrationRecords,
        contributionRecords,
        certificateRecords,
        campaignHistory,
    ] = await Promise.all([
        prismaClient.campaign.findMany({
            where: scopeFilters.campaignWhere,
            orderBy: {
                updatedAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                slogan: true,
                description: true,
                organizerType: true,
                facultyId: true,
                clubId: true,
                approvalStatus: true,
                publicationStatus: true,
                updatedAt: true,
                faculty: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                club: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                campaignFiles: {
                    select: {
                        fileType: true,
                    },
                },
                phases: {
                    select: {
                        id: true,
                        phaseName: true,
                        phaseType: true,
                        startAt: true,
                        endAt: true,
                        registrationStartAt: true,
                        registrationEndAt: true,
                        fundraisingConfig: {
                            select: {
                                targetAmount: true,
                            },
                        },
                        itemDonationConfig: {
                            select: {
                                phaseId: true,
                            },
                        },
                        volunteerConfig: {
                            select: {
                                maxParticipants: true,
                            },
                        },
                        acceptedItems: {
                            select: {
                                id: true,
                            },
                        },
                        registrations: {
                            select: {
                                status: true,
                            },
                        },
                        contributions: {
                            where: {
                                contributionType: ContributionType.MONEY,
                            },
                            select: {
                                status: true,
                                amount: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.clubMembership.findMany({
            where: scopeFilters.membershipWhere,
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
            select: {
                id: true,
                clubId: true,
                status: true,
                approvedAt: true,
                note: true,
                createdAt: true,
                club: {
                    select: {
                        id: true,
                        name: true,
                        facultyId: true,
                        faculty: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        fullName: true,
                        mssv: true,
                        faculty: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.registration.findMany({
            where: scopeFilters.registrationWhere,
            orderBy: {
                appliedAt: 'desc',
            },
            take: 100,
            select: {
                id: true,
                status: true,
                appliedAt: true,
                reviewedAt: true,
                rejectionReason: true,
                phase: {
                    select: {
                        phaseName: true,
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        fullName: true,
                        faculty: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.contribution.findMany({
            where: scopeFilters.contributionWhere,
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
            select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true,
                verifiedAt: true,
                proofFileId: true,
                proofFile: {
                    select: {
                        originalName: true,
                    },
                },
                phase: {
                    select: {
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        fullName: true,
                    },
                },
            },
        }),
        prismaClient.registration.findMany({
            where: {
                AND: [
                    scopeFilters.registrationWhere,
                    {
                        OR: [
                            {
                                status: RegistrationStatus.COMPLETED,
                            },
                            {
                                certificates: {
                                    some: {},
                                },
                            },
                        ],
                    },
                ],
            },
            orderBy: {
                appliedAt: 'desc',
            },
            take: 100,
            select: {
                id: true,
                status: true,
                appliedAt: true,
                phase: {
                    select: {
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        fullName: true,
                    },
                },
                checkins: {
                    select: {
                        checkedInAt: true,
                        checkedOutAt: true,
                    },
                },
                certificates: {
                    orderBy: {
                        issuedAt: 'desc',
                    },
                    take: 1,
                    select: {
                        id: true,
                        issuedAt: true,
                        emailSentAt: true,
                        deliveryStatus: true,
                    },
                },
            },
        }),
        prismaClient.campaignStatusHistory.findMany({
            where: {
                campaign: scopeFilters.campaignWhere,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 30,
            select: {
                id: true,
                statusGroup: true,
                fromStatus: true,
                toStatus: true,
                note: true,
                createdAt: true,
                campaign: {
                    select: {
                        title: true,
                    },
                },
            },
        }),
    ])

    const campaigns = campaignRecords.map((campaign) => mapCampaign(campaign))
    const membershipRequests = membershipRecords.map((membership) =>
        mapMembership(membership)
    )
    const volunteerRegistrations = registrationRecords.map((registration) =>
        mapRegistration(registration)
    )
    const contributionReviews = contributionRecords.map((contribution) =>
        mapContribution(contribution)
    )
    const certificates = certificateRecords.map((registration) =>
        mapCertificate(registration)
    )
    const activityLog = buildActivityLog(
        campaignHistory,
        membershipRecords.slice(0, 10),
        registrationRecords.slice(0, 10),
        contributionRecords.slice(0, 10),
        certificateRecords.slice(0, 10)
    )

    const totalVerifiedAmount = contributionReviews
        .filter((item) => item.status === 'VERIFIED')
        .reduce((sum, item) => sum + item.amount, 0)

    const pendingActions =
        campaigns.filter(
            (campaign) =>
                campaign.approvalStatus === CampaignApprovalStatus.DRAFT ||
                campaign.approvalStatus === CampaignApprovalStatus.SUBMITTED ||
                campaign.approvalStatus === CampaignApprovalStatus.UNDER_PRE_REVIEW ||
                campaign.approvalStatus === CampaignApprovalStatus.PRE_APPROVED ||
                campaign.approvalStatus === CampaignApprovalStatus.UNDER_FINAL_REVIEW ||
                campaign.approvalStatus === CampaignApprovalStatus.REVISION_REQUIRED ||
                (campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
                    (campaign.publicationStatus ===
                        CampaignPublicationStatus.NOT_PUBLIC ||
                        campaign.publicationStatus ===
                            CampaignPublicationStatus.READY_TO_PUBLISH))
        ).length +
        membershipRequests.filter((item) => item.status === 'PENDING').length +
        volunteerRegistrations.filter((item) => item.status === 'PENDING').length +
        contributionReviews.filter((item) => item.status === 'PENDING').length +
        certificates.filter((item) => item.status === 'PENDING').length

    return {
        manager: {
            id: manager.id,
            roleType: manager.roleType,
            status: manager.status,
            scopeName: getManagerScopeName(manager),
            facultyId: manager.facultyId ?? null,
            facultyName: manager.faculty?.name ?? null,
            clubId: manager.clubId ?? null,
            clubName: manager.club?.name ?? null,
        },
        campaigns,
        membershipRequests,
        volunteerRegistrations,
        contributionReviews,
        certificates,
        activityLog,
        pendingActions,
        totalVerifiedAmount,
    }
}

export const updateMembershipStatus = async (
    payload: JwtPayload | undefined,
    membershipId: string,
    input: UpdateMembershipStatusPayload
) => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)
    const membership = await prismaClient.clubMembership.findFirst({
        where: {
            AND: [scopeFilters.membershipWhere, { id: membershipId }],
        },
    })

    if (!membership) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Membership request not found')
    }

    const approvedAt = input.status === 'APPROVED' ? new Date() : null

    return prismaClient.clubMembership.update({
        where: {
            id: membershipId,
        },
        data: {
            status: input.status,
            approvedById: manager.id,
            approvedAt,
            joinedAt:
                input.status === 'APPROVED'
                    ? membership.joinedAt ?? approvedAt
                    : membership.joinedAt,
        },
        select: {
            id: true,
            clubId: true,
            status: true,
            approvedAt: true,
            note: true,
            createdAt: true,
            club: {
                select: {
                    id: true,
                    name: true,
                    facultyId: true,
                    faculty: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            student: {
                select: {
                    fullName: true,
                    mssv: true,
                    faculty: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    })
}

export const reviewRegistration = async (
    payload: JwtPayload | undefined,
    registrationId: string,
    input: ReviewRegistrationPayload
) => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)
    const registration = await prismaClient.registration.findFirst({
        where: {
            AND: [scopeFilters.registrationWhere, { id: registrationId }],
        },
    })

    if (!registration) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Registration not found')
    }

    return prismaClient.registration.update({
        where: {
            id: registrationId,
        },
        data: {
            status: input.status,
            reviewedById: manager.id,
            reviewedAt: new Date(),
            rejectionReason:
                input.status === 'APPROVED' ? null : input.note?.trim() || null,
        },
        select: {
            id: true,
            status: true,
            appliedAt: true,
            reviewedAt: true,
            rejectionReason: true,
            phase: {
                select: {
                    phaseName: true,
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            },
            student: {
                select: {
                    fullName: true,
                    faculty: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    })
}

export const reviewContribution = async (
    payload: JwtPayload | undefined,
    contributionId: string,
    input: ReviewContributionPayload
) => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)
    const contribution = await prismaClient.contribution.findFirst({
        where: {
            AND: [scopeFilters.contributionWhere, { id: contributionId }],
        },
        select: {
            id: true,
            phaseId: true,
            studentId: true,
            createdAt: true,
            phase: {
                select: {
                    phaseType: true,
                },
            },
        },
    })

    if (!contribution) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Contribution not found')
    }

    return prismaClient.$transaction(async (transaction) => {
        const updatedContribution = await transaction.contribution.update({
            where: {
                id: contributionId,
            },
            data: {
                status: input.status,
                verifiedById: manager.id,
                verifiedAt: new Date(),
                rejectionReason:
                    input.status === 'VERIFIED' ? null : input.note?.trim() || null,
            },
            select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true,
                verifiedAt: true,
                proofFileId: true,
                proofFile: {
                    select: {
                        originalName: true,
                    },
                },
                phase: {
                    select: {
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        fullName: true,
                    },
                },
            },
        })

        if (
            input.status === ContributionStatus.VERIFIED &&
            contribution.phase.phaseType === CampaignPhaseType.FUNDRAISING
        ) {
            const existingRegistration = await transaction.registration.findFirst({
                where: {
                    phaseId: contribution.phaseId,
                    studentId: contribution.studentId,
                },
                select: {
                    id: true,
                    status: true,
                },
            })

            if (!existingRegistration) {
                await transaction.registration.create({
                    data: {
                        phaseId: contribution.phaseId,
                        studentId: contribution.studentId,
                        status: RegistrationStatus.COMPLETED,
                        appliedAt: contribution.createdAt,
                        reviewedById: manager.id,
                        reviewedAt: new Date(),
                        rejectionReason: null,
                    },
                })
            } else if (
                existingRegistration.status !== RegistrationStatus.APPROVED &&
                existingRegistration.status !== RegistrationStatus.COMPLETED
            ) {
                await transaction.registration.update({
                    where: {
                        id: existingRegistration.id,
                    },
                    data: {
                        status: RegistrationStatus.COMPLETED,
                        reviewedById: manager.id,
                        reviewedAt: new Date(),
                        rejectionReason: null,
                    },
                })
            }
        }

        return updatedContribution
    })
}

export const submitCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
) => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            AND: [scopeFilters.campaignWhere, { id: campaignId }],
        },
        select: {
            id: true,
            title: true,
            approvalStatus: true,
            campaignFiles: {
                select: {
                    fileType: true,
                },
            },
            phases: {
                select: {
                    phaseType: true,
                    fundraisingConfig: true,
                    itemDonationConfig: true,
                    volunteerConfig: true,
                    acceptedItems: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
            description: true,
            slogan: true,
        },
    })

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    if (
        campaign.approvalStatus !== CampaignApprovalStatus.DRAFT &&
        campaign.approvalStatus !== CampaignApprovalStatus.REVISION_REQUIRED
    ) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only draft or revision-required campaigns can be submitted from this workspace'
        )
    }

    const steps = getCampaignSteps(campaign)
    if (!steps.basicInfo || !steps.attachments || !steps.preview) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Campaign needs basic info, attachments and preview readiness before submission'
        )
    }

    return prismaClient.$transaction(async (transaction) => {
        const updatedCampaign = await transaction.campaign.update({
            where: {
                id: campaignId,
            },
            data: {
                approvalStatus: CampaignApprovalStatus.SUBMITTED,
            },
            select: {
                id: true,
                approvalStatus: true,
                publicationStatus: true,
            },
        })

        await transaction.campaignStatusHistory.create({
            data: {
                campaignId,
                statusGroup: CampaignStatusGroup.APPROVAL,
                fromStatus: campaign.approvalStatus,
                toStatus: CampaignApprovalStatus.SUBMITTED,
                changedById: manager.id,
                note: 'Campaign submitted from manager workspace',
            },
        })

        return updatedCampaign
    })
}

export const approveCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
) => {
    const manager = await getManagerOrThrow(payload)
    ensureAdminCanApprove(manager)

    const campaign = await prismaClient.campaign.findUnique({
        where: {
            id: campaignId,
        },
        select: {
            id: true,
            approvalStatus: true,
            publicationStatus: true,
        },
    })

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    if (campaign.approvalStatus === CampaignApprovalStatus.DRAFT) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Draft campaigns must be submitted before approval'
        )
    }

    if (campaign.approvalStatus === CampaignApprovalStatus.APPROVED) {
        return campaign
    }

    return prismaClient.$transaction(async (transaction) => {
        const publicationStatus =
            campaign.publicationStatus === CampaignPublicationStatus.NOT_PUBLIC
                ? CampaignPublicationStatus.READY_TO_PUBLISH
                : campaign.publicationStatus

        const updatedCampaign = await transaction.campaign.update({
            where: {
                id: campaignId,
            },
            data: {
                approvalStatus: CampaignApprovalStatus.APPROVED,
                publicationStatus,
            },
            select: {
                id: true,
                approvalStatus: true,
                publicationStatus: true,
            },
        })

        await transaction.campaignStatusHistory.create({
            data: {
                campaignId,
                statusGroup: CampaignStatusGroup.APPROVAL,
                fromStatus: campaign.approvalStatus,
                toStatus: CampaignApprovalStatus.APPROVED,
                changedById: manager.id,
                note: 'Campaign approved from manager workspace',
            },
        })

        if (publicationStatus !== campaign.publicationStatus) {
            await transaction.campaignStatusHistory.create({
                data: {
                    campaignId,
                    statusGroup: CampaignStatusGroup.PUBLICATION,
                    fromStatus: campaign.publicationStatus,
                    toStatus: publicationStatus,
                    changedById: manager.id,
                    note: 'Campaign is ready to publish',
                },
            })
        }

        return updatedCampaign
    })
}

export const publishCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
) => {
    const manager = await getManagerOrThrow(payload)
    const scopeFilters = getScopeFilters(manager)
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            AND: [scopeFilters.campaignWhere, { id: campaignId }],
        },
        select: {
            id: true,
            approvalStatus: true,
            publicationStatus: true,
            publicFrom: true,
            phases: {
                select: {
                    startAt: true,
                    endAt: true,
                    registrationStartAt: true,
                    registrationEndAt: true,
                    volunteerConfig: {
                        select: {
                            phaseId: true,
                        },
                    },
                },
            },
        },
    })

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    if (campaign.approvalStatus !== CampaignApprovalStatus.APPROVED) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only approved campaigns can be published'
        )
    }

    const nextPublicationStatus = getPublishStatus(campaign)

    return prismaClient.$transaction(async (transaction) => {
        const updatedCampaign = await transaction.campaign.update({
            where: {
                id: campaignId,
            },
            data: {
                publicationStatus: nextPublicationStatus,
                publicFrom: campaign.publicFrom ?? new Date(),
            },
            select: {
                id: true,
                approvalStatus: true,
                publicationStatus: true,
            },
        })

        await transaction.campaignStatusHistory.create({
            data: {
                campaignId,
                statusGroup: CampaignStatusGroup.PUBLICATION,
                fromStatus: campaign.publicationStatus,
                toStatus: nextPublicationStatus,
                changedById: manager.id,
                note: 'Campaign published from manager workspace',
            },
        })

        return updatedCampaign
    })
}

export const exportWorkspaceReport = async (
    payload: JwtPayload | undefined,
    input: ExportWorkspaceReportPayload
): Promise<WorkspaceReportExportResponse> => {
    const workspace = await getManagerWorkspace(payload)
    const dateSuffix = new Date().toISOString().slice(0, 10)
    const contentType = 'text/csv; charset=utf-8'

    if (input.type === 'volunteers') {
        const csv = buildCsv(
            [
                'campaign_title',
                'student_name',
                'faculty_name',
                'status',
                'preferred_shift',
                'applied_at',
                'note',
            ],
            workspace.volunteerRegistrations.map((item) => [
                item.campaignTitle,
                item.studentName,
                item.facultyName,
                item.status,
                item.preferredShift,
                item.appliedAt.toISOString(),
                item.note,
            ])
        )

        return {
            filename: `workspace-volunteers-${dateSuffix}.csv`,
            contentType,
            content: `\uFEFF${csv}`,
        }
    }

    if (input.type === 'contributions') {
        const csv = buildCsv(
            [
                'campaign_title',
                'donor_name',
                'amount',
                'status',
                'proof_code',
                'submitted_at',
            ],
            workspace.contributionReviews.map((item) => [
                item.campaignTitle,
                item.donorName,
                item.amount,
                item.status,
                item.proofCode,
                item.submittedAt.toISOString(),
            ])
        )

        return {
            filename: `workspace-contributions-${dateSuffix}.csv`,
            contentType,
            content: `\uFEFF${csv}`,
        }
    }

    const csv = buildCsv(
        [
            'campaign_title',
            'organizer_type',
            'scope_name',
            'approval_status',
            'publication_status',
            'fundraising_target',
            'verified_amount',
            'volunteer_slots',
            'approved_volunteers',
            'updated_at',
        ],
        workspace.campaigns.map((item) => [
            item.title,
            item.organizerType,
            item.scopeName,
            item.approvalStatus,
            item.publicationStatus,
            item.fundraisingTarget,
            item.verifiedAmount,
            item.volunteerSlots,
            item.approvedVolunteers,
            item.updatedAt.toISOString(),
        ])
    )

    return {
        filename: `workspace-campaigns-${dateSuffix}.csv`,
        contentType,
        content: `\uFEFF${csv}`,
    }
}
