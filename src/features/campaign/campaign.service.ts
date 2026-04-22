import path from 'node:path'
import ExcelJS from 'exceljs'
import {
    CertificateDeliveryStatus,
    CampaignApprovalStatus,
    CampaignFileType,
    CampaignPhaseType,
    CampaignPublicationStatus,
    CampaignStatusGroup,
    CampaignTemplateType,
    ContributionType,
    ContributionStatus,
    ManagerRoleType,
    NotificationTargetType,
    NotificationType,
    OrganizerType,
    ParticipantScope,
    Prisma,
    RegistrationStatus,
    VerificationMode,
} from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import type { JwtPayload } from 'jsonwebtoken'
import { config, prismaClient, transporter } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import * as authService from 'src/features/auth/auth.service'
import type { AuthTokenPayload } from 'src/features/auth/types'
import * as managerWorkspaceService from 'src/features/managerWorkspace/workspace.service'
import { ApiError } from 'src/utils/ApiError'
import { sanitize } from 'src/utils/sanitize.util'
import * as campaignRepository from './campaign.repository'
import type {
    CampaignCertificateLayoutResponse,
    CampaignActionResponse,
    CampaignDraftBootstrapResponse,
    CampaignDraftResponse,
    CampaignExportResponse,
    CampaignFileAsset,
    CampaignLifecyclePayload,
    CreateDraftCampaignPayload,
    ExportOrganizerCampaignPayload,
    OrganizerBankAccountSummary,
    OrganizerCampaignAcceptedItemInput,
    OrganizerCampaignBootstrapResponse,
    OrganizerCampaignContributionItem,
    OrganizerCampaignDetailResponse,
    OrganizerCampaignDocument,
    OrganizerCampaignHistoryItem,
    OrganizerCampaignListItem,
    OrganizerCampaignListResponse,
    OrganizerCampaignMetricSummary,
    OrganizerCampaignPhaseInput,
    OrganizerCampaignPhaseSummary,
    OrganizerCampaignQuickAction,
    OrganizerCampaignRegistrationItem,
    OrganizerCampaignTemplateDefinition,
    OrganizerCampaignWorkspaceResponse,
    OrganizerCampaignWorkspaceTab,
    SendCampaignCertificateEmailsPayload,
    SendCampaignCertificateEmailsResponse,
    UpsertGeneratedCampaignCertificatesPayload,
    UpsertGeneratedCampaignCertificatesResponse,
    UpdateCampaignCertificateLayoutPayload,
    UpsertOrganizerCampaignPayload,
    UpdateDraftCampaignPayload,
} from './campaign.types'

const DEFAULT_DRAFT_DESCRIPTION = 'Campaign draft is being updated.'

const VOLUNTEER_PHASE_TYPES = new Set<CampaignPhaseType>([
    CampaignPhaseType.VOLUNTEER_RECRUITMENT,
    CampaignPhaseType.FIELD_ACTIVITY,
    CampaignPhaseType.ONLINE_ACTIVITY,
    CampaignPhaseType.BLOOD_DONATION,
])

const EXCEL_REPORT_CONTENT_TYPE =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const REPORT_TEMPLATE_DIRECTORY = path.resolve(
    process.cwd(),
    'template-reports'
)

const REPORT_TEMPLATE_BY_MODE = {
    standard:
        'TEMPLATE_DS SV DANG KY THAM GIA TEN CHIEN DICH - TEN DON VI TO CHUC.xlsx',
    fundraising:
        'TEMPLATE_DS SV DANG KY THAM GIA TEN CHIEN DICH GAY QUY ONLINE - TEN DON VI TO CHUC.xlsx',
} as const

const REPORT_DATA_START_ROW = {
    standard: 9,
    fundraising: 17,
} as const

const VERIFIED_MARK = '✅ Đã xác nhận'
const UNVERIFIED_MARK = '❌ Chưa xác nhận'

const ACTIVE_PUBLICATION_STATUSES = new Set<CampaignPublicationStatus>([
    CampaignPublicationStatus.REGISTRATION_OPEN,
    CampaignPublicationStatus.ONGOING,
    CampaignPublicationStatus.PAUSED,
])

const EDITABLE_APPROVAL_STATUSES = new Set<CampaignApprovalStatus>([
    CampaignApprovalStatus.DRAFT,
    CampaignApprovalStatus.REVISION_REQUIRED,
    CampaignApprovalStatus.REJECTED,
])

const TEMPLATE_DEFINITIONS: OrganizerCampaignTemplateDefinition[] = [
    {
        type: CampaignTemplateType.VOLUNTEER_ONLY,
        code: 'A',
        title: 'Tuyen tinh nguyen vien',
        description:
            'Chien dich chi tap trung vao viec mo dang ky, quan ly va dieu phoi tinh nguyen vien.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.VOLUNTEER_RECRUITMENT,
                label: 'Tinh nguyen vien',
            },
        ],
    },
    {
        type: CampaignTemplateType.FUNDRAISING_ONLY,
        code: 'B',
        title: 'Gay quy hien kim',
        description:
            'Chien dich chi gay quy tien mat, co minh chung, xac minh va tong hop so lieu.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.FUNDRAISING,
                label: 'Gay quy',
            },
        ],
    },
    {
        type: CampaignTemplateType.ITEM_DONATION_ONLY,
        code: 'C',
        title: 'Quyen gop hien vat',
        description:
            'Chien dich tiep nhan hien vat, khai bao danh muc vat pham va dia diem nhan.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.ITEM_DONATION,
                label: 'Quyen gop hien vat',
            },
        ],
    },
    {
        type: CampaignTemplateType.FUNDRAISING_AND_VOLUNTEER,
        code: 'D',
        title: 'Gay quy va tinh nguyen vien',
        description:
            'Ket hop gay quy tien mat voi dang ky tinh nguyen vien trong cung mot workspace chien dich.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.FUNDRAISING,
                label: 'Gay quy',
            },
            {
                phaseType: CampaignPhaseType.VOLUNTEER_RECRUITMENT,
                label: 'Tinh nguyen vien',
            },
        ],
    },
    {
        type: CampaignTemplateType.ITEM_DONATION_AND_VOLUNTEER,
        code: 'E',
        title: 'Hien vat va tinh nguyen vien',
        description:
            'Ket hop tiep nhan hien vat voi dieu phoi tinh nguyen vien cho giai doan van hanh.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.ITEM_DONATION,
                label: 'Quyen gop hien vat',
            },
            {
                phaseType: CampaignPhaseType.VOLUNTEER_RECRUITMENT,
                label: 'Tinh nguyen vien',
            },
        ],
    },
    {
        type: CampaignTemplateType.FUNDRAISING_ITEM_DONATION_AND_VOLUNTEER,
        code: 'F',
        title: 'Gay quy, hien vat va tinh nguyen vien',
        description:
            'Mau day du nhat, phu hop cho chien dich co gay quy, tiep nhan hien vat va trien khai tinh nguyen vien.',
        phaseBlueprint: [
            {
                phaseType: CampaignPhaseType.FUNDRAISING,
                label: 'Gay quy',
            },
            {
                phaseType: CampaignPhaseType.ITEM_DONATION,
                label: 'Quyen gop hien vat',
            },
            {
                phaseType: CampaignPhaseType.VOLUNTEER_RECRUITMENT,
                label: 'Tinh nguyen vien',
            },
        ],
    },
]

const fileAssetSelect = {
    id: true,
    storageKey: true,
    originalName: true,
    mimeType: true,
    fileSize: true,
    createdAt: true,
} satisfies Prisma.FileSelect

const organizerCampaignSelect = {
    id: true,
    title: true,
    slogan: true,
    description: true,
    creatorManagerId: true,
    organizerType: true,
    templateType: true,
    facultyId: true,
    clubId: true,
    approvalStatus: true,
    publicationStatus: true,
    publicFrom: true,
    publicUntil: true,
    createdAt: true,
    updatedAt: true,
    faculty: {
        select: {
            id: true,
            code: true,
            name: true,
        },
    },
    club: {
        select: {
            id: true,
            name: true,
        },
    },
    coverFile: {
        select: fileAssetSelect,
    },
    logoFile: {
        select: fileAssetSelect,
    },
    campaignFiles: {
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            phaseId: true,
            fileId: true,
            fileType: true,
            isPublic: true,
            createdAt: true,
            file: {
                select: fileAssetSelect,
            },
        },
    },
    approvalSteps: {
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            stepType: true,
            status: true,
            comment: true,
            reviewedAt: true,
            createdAt: true,
            reviewer: {
                select: {
                    id: true,
                    username: true,
                    roleType: true,
                    faculty: {
                        select: {
                            name: true,
                        },
                    },
                    club: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    },
    statusHistory: {
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            statusGroup: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
            changedBy: {
                select: {
                    id: true,
                    username: true,
                    roleType: true,
                    faculty: {
                        select: {
                            name: true,
                        },
                    },
                    club: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
        },
    },
    phases: {
        orderBy: {
            phaseOrder: 'asc',
        },
        select: {
            id: true,
            phaseOrder: true,
            phaseName: true,
            phaseType: true,
            startAt: true,
            endAt: true,
            registrationStartAt: true,
            registrationEndAt: true,
            locationText: true,
            status: true,
            fundraisingConfig: {
                select: {
                    phaseId: true,
                    targetAmount: true,
                    bankAccountId: true,
                    transferNotePrefix: true,
                    usageDescription: true,
                    verificationMode: true,
                    bankAccount: {
                        select: {
                            id: true,
                            bankName: true,
                            accountName: true,
                            accountNumber: true,
                            ownerName: true,
                        },
                    },
                    qrFile: {
                        select: fileAssetSelect,
                    },
                },
            },
            itemDonationConfig: {
                select: {
                    phaseId: true,
                    collectionAddress: true,
                    collectionNote: true,
                    allowPreRegistration: true,
                },
            },
            acceptedItems: {
                orderBy: {
                    createdAt: 'asc',
                },
                select: {
                    id: true,
                    itemName: true,
                    description: true,
                },
            },
            volunteerConfig: {
                select: {
                    phaseId: true,
                    maxParticipants: true,
                    participantScope: true,
                    requiresCheckin: true,
                    taskDescription: true,
                    certificateNamePosXPercent: true,
                    certificateNamePosYPercent: true,
                    certificateNameFontSize: true,
                    certificateNameColorHex: true,
                    certificateTemplateFile: {
                        select: fileAssetSelect,
                    },
                },
            },
            registrations: {
                orderBy: {
                    appliedAt: 'desc',
                },
                select: {
                    id: true,
                    status: true,
                    appliedAt: true,
                    rejectionReason: true,
                    student: {
                        select: {
                            fullName: true,
                            mssv: true,
                            email: true,
                            className: true,
                            phone: true,
                            faculty: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    certificates: {
                        select: {
                            id: true,
                            issuedAt: true,
                            deliveryStatus: true,
                            file: {
                                select: fileAssetSelect,
                            },
                        },
                    },
                },
            },
            contributions: {
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    contributionType: true,
                    amount: true,
                    itemDescription: true,
                    createdAt: true,
                    status: true,
                    proofFile: {
                        select: fileAssetSelect,
                    },
                    student: {
                        select: {
                            fullName: true,
                            mssv: true,
                            email: true,
                            className: true,
                            phone: true,
                            faculty: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.CampaignSelect

type FullCampaignRecord = Prisma.CampaignGetPayload<{
    select: typeof organizerCampaignSelect
}>

type ManagerWithContext = NonNullable<
    Awaited<ReturnType<typeof authService.getManagerById>>
>

type OrganizerContext = {
    type: OrganizerType
    scopeName: string
    facultyId: number | null
    facultyName: string | null
    clubId: string | null
    clubName: string | null
}

type PhaseSaveShape = {
    id?: string
    phaseName: string
    phaseType: CampaignPhaseType
    startAt: Date
    endAt: Date
    registrationStartAt: Date | null
    registrationEndAt: Date | null
    locationText: string | null
    fundraisingConfig?: {
        targetAmount: number
        bankAccountId: string | null
        bankAccountDraft: {
            bankName: string
            accountNumber: string
            ownerName: string
            accountName: string
        } | null
        transferNotePrefix: string | null
        usageDescription: string | null
        verificationMode: VerificationMode
    }
    itemDonationConfig?: {
        collectionAddress: string
        collectionNote: string | null
        allowPreRegistration: boolean
        acceptedItems: OrganizerCampaignAcceptedItemInput[]
    }
    volunteerConfig?: {
        maxParticipants: number
        participantScope: ParticipantScope
        requiresCheckin: boolean
        taskDescription: string | null
    }
}

type PreparedCampaignSaveInput = {
    title: string
    slogan: string | null
    description: string
    templateType: CampaignTemplateType
    publicFrom: Date | null
    publicUntil: Date | null
    phases: PhaseSaveShape[]
}

type DbTransaction = Prisma.TransactionClient
type CampaignCategory = 'fundraising' | 'itemDonation' | 'volunteer' | 'other'

type BankAccountDraft = NonNullable<
    NonNullable<PhaseSaveShape['fundraisingConfig']>['bankAccountDraft']
>

const ATTACHMENT_FILE_TYPES = new Set<CampaignFileType>([
    CampaignFileType.PLAN,
    CampaignFileType.BUDGET,
])

const EVIDENCE_FILE_TYPES = new Set<CampaignFileType>([
    CampaignFileType.GALLERY,
    CampaignFileType.REPORT,
])

const APPROVAL_STATUSES_REQUIRING_APPROVAL = new Set<CampaignApprovalStatus>([
    CampaignApprovalStatus.SUBMITTED,
    CampaignApprovalStatus.UNDER_PRE_REVIEW,
    CampaignApprovalStatus.PRE_APPROVED,
    CampaignApprovalStatus.UNDER_FINAL_REVIEW,
    CampaignApprovalStatus.REVISION_REQUIRED,
])

const PUBLISHABLE_STATUSES = new Set<CampaignPublicationStatus>([
    CampaignPublicationStatus.NOT_PUBLIC,
    CampaignPublicationStatus.READY_TO_PUBLISH,
])

const PAUSABLE_STATUSES = new Set<CampaignPublicationStatus>([
    CampaignPublicationStatus.REGISTRATION_OPEN,
    CampaignPublicationStatus.ONGOING,
])

const POST_LAUNCH_STATUSES = new Set<CampaignPublicationStatus>([
    CampaignPublicationStatus.ONGOING,
    CampaignPublicationStatus.PAUSED,
    CampaignPublicationStatus.ENDED,
])

const RESUMABLE_PUBLICATION_STATUSES = new Set<CampaignPublicationStatus>([
    CampaignPublicationStatus.REGISTRATION_OPEN,
    CampaignPublicationStatus.ONGOING,
    CampaignPublicationStatus.PUBLISHED,
])

const requireManagerPayload = (payload?: JwtPayload) => {
    const authPayload = payload as Partial<AuthTokenPayload> | undefined

    if (!authPayload?.userId || authPayload.subjectType !== 'manager') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Only manager accounts can access organizer campaigns'
        )
    }

    return authPayload as AuthTokenPayload
}

const getManagerContext = (manager: ManagerWithContext): OrganizerContext => {
    authService.ensureManagerActive(manager)
    const scope = authService.ensureManagerContext(manager)

    if (manager.roleType === ManagerRoleType.CLB_MANAGER) {
        return {
            type: OrganizerType.CLB,
            scopeName: scope.scopeName,
            facultyId: manager.facultyId ?? null,
            facultyName: manager.faculty?.name ?? null,
            clubId: manager.clubId ?? null,
            clubName: manager.club?.name ?? null,
        }
    }

    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        return {
            type: OrganizerType.LCD,
            scopeName: scope.scopeName,
            facultyId: manager.facultyId ?? null,
            facultyName: manager.faculty?.name ?? null,
            clubId: null,
            clubName: null,
        }
    }

    return {
        type: OrganizerType.DOANTRUONG,
        scopeName: scope.scopeName,
        facultyId: null,
        facultyName: null,
        clubId: null,
        clubName: null,
    }
}

const getAllowedParticipantScopes = (
    manager: ManagerWithContext
): ParticipantScope[] => {
    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        return [ParticipantScope.FACULTY_ONLY, ParticipantScope.ALL_STUDENTS]
    }

    if (manager.roleType === ManagerRoleType.CLB_MANAGER) {
        return [
            ParticipantScope.CLUB_MEMBERS_ONLY,
            ParticipantScope.ALL_STUDENTS,
        ]
    }

    return [ParticipantScope.ALL_STUDENTS]
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

    return manager
}

const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
    value == null ? 0 : Number(value)

const toTrimmedNullable = (value?: string | null) => {
    const normalized = value?.trim()
    return normalized ? normalized : null
}

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()

const resolveCampaignWhere = (
    organizer: OrganizerContext
): Prisma.CampaignWhereInput => {
    if (organizer.type === OrganizerType.CLB) {
        return {
            organizerType: OrganizerType.CLB,
            clubId: organizer.clubId ?? undefined,
        }
    }

    if (organizer.type === OrganizerType.LCD) {
        return {
            organizerType: OrganizerType.LCD,
            facultyId: organizer.facultyId ?? undefined,
        }
    }

    return {
        organizerType: OrganizerType.DOANTRUONG,
    }
}

const resolveManagerDisplayName = (manager: {
    username: string
    roleType: ManagerRoleType
    faculty: { name: string } | null
    club: { name: string } | null
}) => {
    if (manager.roleType === ManagerRoleType.CLB_MANAGER) {
        return manager.club?.name ?? manager.username
    }

    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        return manager.faculty?.name ?? manager.username
    }

    return 'Doan truong'
}

const getSafeCloudinaryPath = (storageKey: string) =>
    storageKey
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')

const resolveCloudinaryUrl = (
    storageKey: string,
    mimeType: string,
    _originalName: string
) => {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
        return storageKey
    }

    if (!config.cloudinary.cloud_name) {
        return null
    }

    const resourceType = mimeType.startsWith('image/')
        ? 'image'
        : mimeType.startsWith('video/')
          ? 'video'
          : 'raw'
    const safePath = getSafeCloudinaryPath(storageKey)

    return `https://res.cloudinary.com/${config.cloudinary.cloud_name}/${resourceType}/upload/${safePath}`
}

let hasConfiguredCampaignCloudinary = false

const ensureCampaignCloudinaryConfigured = () => {
    if (!config.cloudinary.is_configured) {
        return false
    }

    if (hasConfiguredCampaignCloudinary) {
        return true
    }

    cloudinary.config({
        cloud_name: config.cloudinary.cloud_name,
        api_key: config.cloudinary.api_key,
        api_secret: config.cloudinary.api_secret,
        secure: true,
    })
    hasConfiguredCampaignCloudinary = true

    return true
}

const resolveFileExtension = (originalName: string, mimeType: string) => {
    const extensionFromName = path.extname(originalName).replace(/^\./, '').trim()
    if (extensionFromName) {
        return extensionFromName.toLowerCase()
    }

    if (mimeType === 'application/pdf') {
        return 'pdf'
    }

    if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return 'docx'
    }

    if (mimeType === 'application/msword') {
        return 'doc'
    }

    if (mimeType === 'image/png') {
        return 'png'
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return 'jpg'
    }

    if (mimeType === 'image/webp') {
        return 'webp'
    }

    if (mimeType === 'image/gif') {
        return 'gif'
    }

    return 'bin'
}

const sanitizeFilename = (value: string) =>
    value
        .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '')

const ensureFilenameWithExtension = (
    originalName: string,
    mimeType: string,
    fallbackBaseName: string
) => {
    const extension = resolveFileExtension(originalName, mimeType)
    const safeFallbackBase = sanitizeFilename(fallbackBaseName) || 'tep-tin'
    const safeOriginalName = sanitizeFilename(originalName)

    if (!safeOriginalName) {
        return `${safeFallbackBase}.${extension}`
    }

    const existingExtension = path
        .extname(safeOriginalName)
        .replace(/^\./, '')
        .toLowerCase()

    if (!existingExtension || existingExtension === 'bin') {
        return `${safeOriginalName}.${extension}`
    }

    if (extension !== 'bin' && existingExtension !== extension) {
        const baseName = safeOriginalName.slice(
            0,
            safeOriginalName.length - existingExtension.length - 1
        )
        return `${baseName}.${extension}`
    }

    return safeOriginalName
}

const resolveCloudinaryDownloadResourceType = (mimeType: string) => {
    if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        return 'image'
    }

    if (mimeType.startsWith('video/')) {
        return 'video'
    }

    return 'raw'
}

const resolveSignedCloudinaryDownloadUrl = (
    storageKey: string,
    mimeType: string,
    originalName: string,
    expiresInSeconds = 60 * 10
) => {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
        return storageKey
    }

    if (!ensureCampaignCloudinaryConfigured()) {
        return null
    }

    const resourceType = resolveCloudinaryDownloadResourceType(mimeType)
    const format = resolveFileExtension(originalName, mimeType)

    return cloudinary.utils.private_download_url(storageKey, format, {
        resource_type: resourceType,
        type: 'upload',
        attachment: false,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
}

const resolveSignedCloudinaryDownloadUrlByResourceType = (
    storageKey: string,
    mimeType: string,
    originalName: string,
    resourceType: 'image' | 'video' | 'raw',
    expiresInSeconds = 60 * 10
) => {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
        return storageKey
    }

    if (!ensureCampaignCloudinaryConfigured()) {
        return null
    }

    const format = resolveFileExtension(originalName, mimeType)
    return cloudinary.utils.private_download_url(storageKey, format, {
        resource_type: resourceType,
        type: 'upload',
        attachment: false,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
}

const isLikelyHtmlPayload = (buffer: Buffer) => {
    const header = buffer.subarray(0, 256).toString('utf-8').toLowerCase()
    return (
        header.includes('<!doctype html') ||
        header.includes('<html') ||
        header.includes('<body')
    )
}

const hasPdfSignature = (buffer: Buffer) =>
    buffer.length >= 5 && buffer.subarray(0, 5).toString('utf-8') === '%PDF-'

const hasPngSignature = (buffer: Buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a

const hasJpegSignature = (buffer: Buffer) =>
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff

const hasWebpSignature = (buffer: Buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'

const hasGifSignature = (buffer: Buffer) => {
    if (buffer.length < 6) {
        return false
    }

    const signature = buffer.subarray(0, 6).toString('ascii')
    return signature === 'GIF87a' || signature === 'GIF89a'
}

const detectMimeTypeFromBuffer = (buffer: Buffer): string | null => {
    if (hasPdfSignature(buffer)) {
        return 'application/pdf'
    }
    if (hasPngSignature(buffer)) {
        return 'image/png'
    }
    if (hasJpegSignature(buffer)) {
        return 'image/jpeg'
    }
    if (hasWebpSignature(buffer)) {
        return 'image/webp'
    }
    if (hasGifSignature(buffer)) {
        return 'image/gif'
    }
    return null
}

const hasExpectedImageSignature = (buffer: Buffer, mimeType: string) => {
    if (mimeType === 'image/png') {
        return hasPngSignature(buffer)
    }
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return hasJpegSignature(buffer)
    }
    if (mimeType === 'image/webp') {
        return hasWebpSignature(buffer)
    }
    if (mimeType === 'image/gif') {
        return hasGifSignature(buffer)
    }
    return true
}

const fetchFileBufferFromStorage = async (file: {
    storageKey: string
    mimeType: string
    originalName: string
}) => {
    const signedUrl = resolveSignedCloudinaryDownloadUrl(
        file.storageKey,
        file.mimeType,
        file.originalName
    )
    const fallbackUrl = resolveCloudinaryUrl(
        file.storageKey,
        file.mimeType,
        file.originalName
    )
    const candidateUrls: string[] = []
    const addCandidateUrl = (url: string | null) => {
        if (!url) {
            return
        }
        if (!candidateUrls.includes(url)) {
            candidateUrls.push(url)
        }
    }

    addCandidateUrl(signedUrl)
    addCandidateUrl(
        resolveSignedCloudinaryDownloadUrlByResourceType(
            file.storageKey,
            file.mimeType,
            file.originalName,
            'raw'
        )
    )
    addCandidateUrl(
        resolveSignedCloudinaryDownloadUrlByResourceType(
            file.storageKey,
            file.mimeType,
            file.originalName,
            'image'
        )
    )
    addCandidateUrl(fallbackUrl)

    if (file.mimeType === 'application/pdf' && fallbackUrl) {
        const fallbackExtension = path.extname(fallbackUrl)
        if (!fallbackExtension) {
            addCandidateUrl(`${fallbackUrl}.pdf`)
        }
    }

    if (candidateUrls.length === 0) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Cloudinary is not configured'
        )
    }

    const errors: string[] = []

    for (const url of candidateUrls) {
        try {
            const upstreamResponse = await fetch(url)
            if (!upstreamResponse.ok) {
                errors.push(`${url} -> status ${upstreamResponse.status}`)
                continue
            }

            const arrayBuffer = await upstreamResponse.arrayBuffer()
            const fileBuffer = Buffer.from(arrayBuffer)

            if (isLikelyHtmlPayload(fileBuffer)) {
                errors.push(`${url} -> html payload`)
                continue
            }

            if (
                file.mimeType === 'application/pdf' &&
                !hasPdfSignature(fileBuffer)
            ) {
                errors.push(`${url} -> invalid pdf signature`)
                continue
            }

            if (
                file.mimeType.startsWith('image/') &&
                !hasExpectedImageSignature(fileBuffer, file.mimeType)
            ) {
                errors.push(`${url} -> invalid image signature`)
                continue
            }

            return fileBuffer
        } catch (error) {
            errors.push(
                `${url} -> ${
                    error instanceof Error ? error.message : 'fetch failed'
                }`
            )
        }
    }

    throw new ApiError(
        HttpStatus.BAD_GATEWAY,
        `Unable to fetch valid certificate file from storage provider. Tried ${candidateUrls.length} URL(s): ${errors.join(' | ')}`
    )
}

const mapFileAsset = (file: {
    id: string
    storageKey: string
    originalName: string
    mimeType: string
    fileSize: bigint
    createdAt: Date
} | null): CampaignFileAsset | null => {
    if (!file) {
        return null
    }

    return {
        id: file.id,
        originalName: ensureFilenameWithExtension(
            file.originalName,
            file.mimeType,
            'tep-tin'
        ),
        mimeType: file.mimeType,
        fileSize: Number(file.fileSize),
        url: resolveCloudinaryUrl(
            file.storageKey,
            file.mimeType,
            file.originalName
        ),
        createdAt: file.createdAt,
    }
}

const toSafeAsciiFilename = (filename: string) =>
    filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '_')
        .replace(/["\\]/g, '_')
        .trim()

const resolveAttachmentMimeType = (
    sourceMimeType: string,
    detectedMimeType: string | null
) => {
    if (detectedMimeType) {
        if (sourceMimeType === detectedMimeType) {
            return sourceMimeType
        }
        if (sourceMimeType === 'application/pdf') {
            return detectedMimeType
        }
        if (
            sourceMimeType.startsWith('image/') &&
            detectedMimeType.startsWith('image/')
        ) {
            return detectedMimeType
        }
        return detectedMimeType
    }

    return sourceMimeType || 'application/octet-stream'
}

const getCampaignReadiness = (campaign: FullCampaignRecord) => {
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
        ATTACHMENT_FILE_TYPES.has(file.fileType)
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

const getCampaignNextAction = (campaign: FullCampaignRecord) => {
    const readiness = getCampaignReadiness(campaign)
    const readinessLabels = {
        basicInfo: 'thông tin cơ bản',
        fundraising: 'thiết lập gây quỹ',
        itemDonation: 'thiết lập quyên góp hiện vật',
        volunteerRecruitment: 'thiết lập tình nguyện viên',
        attachments: 'tài liệu đính kèm',
        preview: 'hình ảnh hoặc nội dung giới thiệu',
    } satisfies Record<keyof typeof readiness, string>

    if (campaign.approvalStatus === CampaignApprovalStatus.DRAFT) {
        const missingSteps = Object.entries(readiness)
            .filter(([, completed]) => !completed)
            .map(([key]) => readinessLabels[key as keyof typeof readinessLabels])

        if (missingSteps.length > 0) {
            return `Hoàn tất ${missingSteps.slice(0, 2).join(', ')} trước khi gửi duyệt.`
        }

        return 'Hồ sơ đã sẵn sàng để gửi duyệt.'
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.SUBMITTED ||
        campaign.approvalStatus === CampaignApprovalStatus.UNDER_PRE_REVIEW ||
        campaign.approvalStatus === CampaignApprovalStatus.PRE_APPROVED ||
        campaign.approvalStatus === CampaignApprovalStatus.UNDER_FINAL_REVIEW
    ) {
        return 'Theo dõi quá trình phê duyệt và cập nhật nếu có yêu cầu bổ sung.'
    }

    if (campaign.approvalStatus === CampaignApprovalStatus.REVISION_REQUIRED) {
        return 'Bổ sung hồ sơ theo phản hồi và gửi duyệt lại.'
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
        (campaign.publicationStatus === CampaignPublicationStatus.NOT_PUBLIC ||
            campaign.publicationStatus ===
                CampaignPublicationStatus.READY_TO_PUBLISH)
    ) {
        return 'Có thể công khai chiến dịch khi đã sẵn sàng mở tiếp nhận.'
    }

    if (
        campaign.publicationStatus === CampaignPublicationStatus.REGISTRATION_OPEN
    ) {
        return 'Đang mở đăng ký, cần theo dõi hàng chờ tình nguyện viên và đóng góp.'
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.ONGOING) {
        return 'Theo dõi tiến độ thực hiện, check-in và kết quả chiến dịch.'
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.PAUSED) {
        return 'Chiến dịch đang tạm dừng, có thể tiếp tục hoặc kết thúc khi sẵn sàng.'
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.ENDED) {
        return 'Tổng hợp báo cáo, chứng nhận và tài liệu kết thúc chiến dịch.'
    }

    return 'Theo dõi các cập nhật mới nhất trong workspace.'
}

const getCurrentPhaseLabel = (campaign: FullCampaignRecord) => {
    const now = new Date()
    const currentPhase = campaign.phases.find(
        (phase) =>
            (phase.registrationStartAt &&
                phase.registrationEndAt &&
                phase.registrationStartAt <= now &&
                phase.registrationEndAt >= now) ||
            (phase.startAt <= now && phase.endAt >= now)
    )

    if (currentPhase) {
        return currentPhase.phaseName
    }

    const upcomingPhase = campaign.phases.find(
        (phase) =>
            phase.registrationStartAt
                ? phase.registrationStartAt > now
                : phase.startAt > now
    )

    if (upcomingPhase) {
        return upcomingPhase.phaseName
    }

    return campaign.phases[campaign.phases.length - 1]?.phaseName ?? null
}

const getPublishStatus = (campaign: Pick<FullCampaignRecord, 'phases'>) => {
    const now = new Date()
    const hasOpenVolunteerRegistration = campaign.phases.some(
        (phase) =>
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
        (phase) => phase.startAt <= now && phase.endAt >= now
    )

    if (hasOngoingPhase) {
        return CampaignPublicationStatus.ONGOING
    }

    return CampaignPublicationStatus.PUBLISHED
}

const mapMetrics = (campaign: FullCampaignRecord): OrganizerCampaignMetricSummary => {
    const fundraisingTarget = campaign.phases.reduce((total, phase) => {
        return total + toNumber(phase.fundraisingConfig?.targetAmount)
    }, 0)

    const verifiedAmount = campaign.phases.reduce((total, phase) => {
        const phaseTotal = phase.contributions
            .filter(
                (contribution) =>
                    contribution.status === ContributionStatus.VERIFIED
            )
            .reduce((phaseSum, contribution) => {
                return phaseSum + toNumber(contribution.amount)
            }, 0)

        return total + phaseTotal
    }, 0)

    const volunteerSlots = campaign.phases.reduce((total, phase) => {
        if (!VOLUNTEER_PHASE_TYPES.has(phase.phaseType)) {
            return total
        }

        return total + (phase.volunteerConfig?.maxParticipants ?? 0)
    }, 0)

    const approvedVolunteers = campaign.phases.reduce((total, phase) => {
        return (
            total +
            phase.registrations.filter(
                (registration) =>
                    registration.status === 'APPROVED' ||
                    registration.status === 'COMPLETED'
            ).length
        )
    }, 0)

    const pendingRegistrations = campaign.phases.reduce((total, phase) => {
        return (
            total +
            phase.registrations.filter(
                (registration) => registration.status === 'PENDING'
            ).length
        )
    }, 0)

    const pendingContributions = campaign.phases.reduce((total, phase) => {
        return (
            total +
            phase.contributions.filter(
                (contribution) =>
                    contribution.status === ContributionStatus.PENDING
            ).length
        )
    }, 0)

    const acceptedItemCategories = campaign.phases.reduce((total, phase) => {
        return total + phase.acceptedItems.length
    }, 0)

    return {
        verifiedAmount,
        fundraisingTarget,
        approvedVolunteers,
        volunteerSlots,
        pendingRegistrations,
        pendingContributions,
        acceptedItemCategories,
    }
}

const ELIGIBLE_CERTIFICATE_REGISTRATION_STATUSES = new Set<RegistrationStatus>([
    RegistrationStatus.APPROVED,
    RegistrationStatus.COMPLETED,
])

const ensureVerifiedFundraisingContributionRegistrations = async (
    campaignId: string,
    managerId: string,
    phaseId?: string
) => {
    const verifiedContributions = await prismaClient.contribution.findMany({
        where: {
            status: ContributionStatus.VERIFIED,
            phase: {
                campaignId,
                phaseType: CampaignPhaseType.FUNDRAISING,
                ...(phaseId ? { id: phaseId } : {}),
            },
        },
        select: {
            phaseId: true,
            studentId: true,
            createdAt: true,
        },
    })

    if (verifiedContributions.length === 0) {
        return {
            createdCount: 0,
            updatedCount: 0,
        }
    }

    const phaseIds = Array.from(
        new Set(verifiedContributions.map((item) => item.phaseId))
    )
    const studentIds = Array.from(
        new Set(verifiedContributions.map((item) => item.studentId))
    )

    const existingRegistrations = await prismaClient.registration.findMany({
        where: {
            phaseId: {
                in: phaseIds,
            },
            studentId: {
                in: studentIds,
            },
        },
        select: {
            id: true,
            phaseId: true,
            studentId: true,
            status: true,
        },
    })

    const existingByKey = new Map(
        existingRegistrations.map((registration) => [
            `${registration.phaseId}:${registration.studentId}`,
            registration,
        ])
    )

    const registrationCreates: Array<{
        phaseId: string
        studentId: string
        status: RegistrationStatus
        appliedAt: Date
        reviewedById: string
        reviewedAt: Date
        rejectionReason: null
    }> = []
    const registrationIdsToPromote: string[] = []

    for (const contribution of verifiedContributions) {
        const key = `${contribution.phaseId}:${contribution.studentId}`
        const existing = existingByKey.get(key)

        if (!existing) {
            registrationCreates.push({
                phaseId: contribution.phaseId,
                studentId: contribution.studentId,
                status: RegistrationStatus.COMPLETED,
                appliedAt: contribution.createdAt,
                reviewedById: managerId,
                reviewedAt: new Date(),
                rejectionReason: null,
            })
            continue
        }

        if (!ELIGIBLE_CERTIFICATE_REGISTRATION_STATUSES.has(existing.status)) {
            registrationIdsToPromote.push(existing.id)
        }
    }

    await prismaClient.$transaction(async (transaction) => {
        if (registrationCreates.length > 0) {
            await transaction.registration.createMany({
                data: registrationCreates,
                skipDuplicates: true,
            })
        }

        if (registrationIdsToPromote.length > 0) {
            await transaction.registration.updateMany({
                where: {
                    id: {
                        in: registrationIdsToPromote,
                    },
                },
                data: {
                    status: RegistrationStatus.COMPLETED,
                    reviewedById: managerId,
                    reviewedAt: new Date(),
                    rejectionReason: null,
                },
            })
        }
    })

    return {
        createdCount: registrationCreates.length,
        updatedCount: registrationIdsToPromote.length,
    }
}

const buildQuickActions = (
    campaign: FullCampaignRecord,
    manager: ManagerWithContext
): OrganizerCampaignQuickAction[] => {
    const actions: OrganizerCampaignQuickAction[] = [
        {
            key: 'view',
            label: 'Mở workspace',
        },
    ]

    if (EDITABLE_APPROVAL_STATUSES.has(campaign.approvalStatus)) {
        actions.push({
            key: 'edit',
            label: 'Chỉnh sửa',
        })
    }

    const readiness = getCampaignReadiness(campaign)
    const isReadyForSubmission =
        readiness.basicInfo && readiness.attachments && readiness.preview

    if (
        campaign.approvalStatus === CampaignApprovalStatus.DRAFT &&
        isReadyForSubmission
    ) {
        actions.push({
            key: 'submit',
            label: 'Gửi duyệt',
        })
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.REVISION_REQUIRED &&
        isReadyForSubmission
    ) {
        actions.push({
            key: 'resubmit',
            label: 'Gửi duyệt lại',
        })
    }

    if (
        manager.roleType === ManagerRoleType.DOANTRUONG_ADMIN &&
        APPROVAL_STATUSES_REQUIRING_APPROVAL.has(campaign.approvalStatus)
    ) {
        actions.push({
            key: 'approve',
            label: 'Phê duyệt',
        })
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
        PUBLISHABLE_STATUSES.has(campaign.publicationStatus)
    ) {
        actions.push({
            key: 'publish',
            label: 'Công khai',
        })
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED &&
        PAUSABLE_STATUSES.has(campaign.publicationStatus)
    ) {
        actions.push({
            key: 'pause',
            label: 'Tạm dừng',
        })
    }

    if (campaign.publicationStatus === CampaignPublicationStatus.PAUSED) {
        actions.push({
            key: 'resume',
            label: 'Tiếp tục',
        })
    }

    if (ACTIVE_PUBLICATION_STATUSES.has(campaign.publicationStatus)) {
        actions.push({
            key: 'end',
            label: 'Kết thúc',
        })
    }

    if (EDITABLE_APPROVAL_STATUSES.has(campaign.approvalStatus)) {
        actions.push({
            key: 'delete',
            label: 'Xóa',
        })
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED ||
        campaign.phases.length > 0
    ) {
        actions.push({
            key: 'export',
            label: 'Xuất nhanh',
        })
    }

    return actions
}

const mapPhaseSummary = (
    phase: FullCampaignRecord['phases'][number]
): OrganizerCampaignPhaseSummary => ({
    id: phase.id,
    phaseOrder: phase.phaseOrder,
    phaseName: phase.phaseName,
    phaseType: phase.phaseType,
    startAt: phase.startAt,
    endAt: phase.endAt,
    registrationStartAt: phase.registrationStartAt,
    registrationEndAt: phase.registrationEndAt,
    locationText: phase.locationText,
    status: phase.status,
    fundraisingConfig: phase.fundraisingConfig
        ? {
              targetAmount: toNumber(phase.fundraisingConfig.targetAmount),
              transferNotePrefix:
                  phase.fundraisingConfig.transferNotePrefix ?? null,
              usageDescription:
                  phase.fundraisingConfig.usageDescription ?? null,
              verificationMode: phase.fundraisingConfig.verificationMode,
              bankAccount: {
                  id: phase.fundraisingConfig.bankAccount.id,
                  bankName: phase.fundraisingConfig.bankAccount.bankName,
                  accountName: phase.fundraisingConfig.bankAccount.accountName,
                  accountNumber:
                      phase.fundraisingConfig.bankAccount.accountNumber,
                  ownerName: phase.fundraisingConfig.bankAccount.ownerName,
              },
              qrFile: mapFileAsset(phase.fundraisingConfig.qrFile),
          }
        : null,
    itemDonationConfig: phase.itemDonationConfig
        ? {
              collectionAddress: phase.itemDonationConfig.collectionAddress,
              collectionNote: phase.itemDonationConfig.collectionNote ?? null,
              allowPreRegistration:
                  phase.itemDonationConfig.allowPreRegistration,
              acceptedItems: phase.acceptedItems.map((item) => ({
                  id: item.id,
                  itemName: item.itemName,
                  description: item.description ?? null,
              })),
          }
        : null,
    volunteerConfig: phase.volunteerConfig
        ? {
              maxParticipants: phase.volunteerConfig.maxParticipants,
              participantScope: phase.volunteerConfig.participantScope,
              requiresCheckin: phase.volunteerConfig.requiresCheckin,
              taskDescription: phase.volunteerConfig.taskDescription ?? null,
              certificateNamePosXPercent: toNumber(
                  phase.volunteerConfig.certificateNamePosXPercent
              ),
              certificateNamePosYPercent: toNumber(
                  phase.volunteerConfig.certificateNamePosYPercent
              ),
              certificateNameFontSize:
                  phase.volunteerConfig.certificateNameFontSize,
              certificateNameColorHex:
                  phase.volunteerConfig.certificateNameColorHex,
              certificateTemplateFile: mapFileAsset(
                  phase.volunteerConfig.certificateTemplateFile
              ),
          }
        : null,
})

const mapDocuments = (campaign: FullCampaignRecord): OrganizerCampaignDocument[] =>
    campaign.campaignFiles.map((item) => ({
        id: item.id,
        fileId: item.fileId,
        fileType: item.fileType,
        phaseId: item.phaseId ?? null,
        isPublic: item.isPublic,
        createdAt: item.createdAt,
        file: mapFileAsset(item.file)!,
    }))

const mapCampaignDetail = (
    campaign: FullCampaignRecord,
    manager: ManagerWithContext
): OrganizerCampaignDetailResponse => {
    const organizer = {
        type: campaign.organizerType,
        scopeName:
            campaign.club?.name ??
            campaign.faculty?.name ??
            (campaign.organizerType === OrganizerType.DOANTRUONG
                ? 'Đoàn trường'
                : 'Đơn vị'),
        facultyId: campaign.facultyId ?? null,
        facultyName: campaign.faculty?.name ?? null,
        clubId: campaign.clubId ?? null,
        clubName: campaign.club?.name ?? null,
    }

    return {
        id: campaign.id,
        title: campaign.title,
        slogan: campaign.slogan,
        description: campaign.description,
        organizerType: campaign.organizerType,
        templateType: campaign.templateType,
        approvalStatus: campaign.approvalStatus,
        publicationStatus: campaign.publicationStatus,
        publicFrom: campaign.publicFrom,
        publicUntil: campaign.publicUntil,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        organizer,
        currentPhaseLabel: getCurrentPhaseLabel(campaign),
        nextAction: getCampaignNextAction(campaign),
        metrics: mapMetrics(campaign),
        quickActions: buildQuickActions(campaign, manager),
        coverImage: mapFileAsset(campaign.coverFile),
        logoImage: mapFileAsset(campaign.logoFile),
        documents: mapDocuments(campaign),
        phases: campaign.phases.map(mapPhaseSummary),
    }
}

const mapCampaignListItem = (
    campaign: FullCampaignRecord,
    manager: ManagerWithContext
): OrganizerCampaignListItem => {
    const detail = mapCampaignDetail(campaign, manager)

    return {
        id: detail.id,
        title: detail.title,
        slogan: detail.slogan,
        description: detail.description,
        organizerType: detail.organizerType,
        templateType: detail.templateType,
        scopeName: detail.organizer.scopeName,
        approvalStatus: detail.approvalStatus,
        publicationStatus: detail.publicationStatus,
        publicFrom: detail.publicFrom,
        publicUntil: detail.publicUntil,
        currentPhaseLabel: detail.currentPhaseLabel,
        nextAction: detail.nextAction,
        metrics: detail.metrics,
        quickActions: detail.quickActions,
        coverImage: detail.coverImage,
        updatedAt: detail.updatedAt,
    }
}

const buildWorkspaceTabs = (
    campaign: FullCampaignRecord
): OrganizerCampaignWorkspaceTab[] => {
    const tabs: OrganizerCampaignWorkspaceTab[] = [
        {
            id: 'overview',
            label: 'Tổng quan',
        },
        {
            id: 'phases',
            label: 'Giai đoạn',
        },
        {
            id: 'documents',
            label: 'Tài liệu & phê duyệt',
        },
    ]

    const hasFundraising = campaign.phases.some(
        (phase) => phase.phaseType === CampaignPhaseType.FUNDRAISING
    )
    const hasItemDonation = campaign.phases.some(
        (phase) => phase.phaseType === CampaignPhaseType.ITEM_DONATION
    )
    const hasVolunteer = campaign.phases.some((phase) =>
        VOLUNTEER_PHASE_TYPES.has(phase.phaseType)
    )

    if (hasFundraising) {
        tabs.push({
            id: 'fundraising',
            label: 'Gây quỹ',
        })
    }

    if (hasItemDonation) {
        tabs.push({
            id: 'item-donation',
            label: 'Quyên góp hiện vật',
        })
    }

    if (hasVolunteer) {
        tabs.push({
            id: 'volunteers',
            label: 'Tình nguyện viên',
        })
    }

    const hasCertificates = campaign.phases.some((phase) =>
        phase.registrations.some(
            (registration) => registration.certificates.length > 0
        )
    )
    if (hasCertificates || POST_LAUNCH_STATUSES.has(campaign.publicationStatus)) {
        tabs.push({
            id: 'certificates',
            label: 'Chứng nhận',
        })
    }

    const hasActivityEvidence = campaign.campaignFiles.some((file) =>
        EVIDENCE_FILE_TYPES.has(file.fileType)
    )
    if (
        hasActivityEvidence ||
        POST_LAUNCH_STATUSES.has(campaign.publicationStatus)
    ) {
        tabs.push({
            id: 'activity-evidence',
            label: 'Hình ảnh & minh chứng hoạt động',
        })
    }

    if (
        campaign.approvalStatus === CampaignApprovalStatus.APPROVED ||
        campaign.publicationStatus !== CampaignPublicationStatus.NOT_PUBLIC
    ) {
        tabs.push({
            id: 'reports',
            label: 'Báo cáo',
        })
    }

    return tabs
}

const buildWorkspace = (
    campaign: FullCampaignRecord,
    manager: ManagerWithContext
): OrganizerCampaignWorkspaceResponse => {
    const detail = mapCampaignDetail(campaign, manager)

    const registrations: OrganizerCampaignRegistrationItem[] = campaign.phases.flatMap(
        (phase) =>
            phase.registrations.map((registration) => ({
                id: registration.id,
                phaseId: phase.id,
                phaseName: phase.phaseName,
                studentName: registration.student.fullName,
                studentCode: registration.student.mssv,
                studentEmail: registration.student.email,
                facultyName: registration.student.faculty.name,
                appliedAt: registration.appliedAt,
                status: registration.status,
                note: registration.rejectionReason ?? null,
            }))
    )

    const contributions: OrganizerCampaignContributionItem[] = campaign.phases.flatMap(
        (phase) =>
            phase.contributions.map((contribution) => ({
                id: contribution.id,
                phaseId: phase.id,
                phaseName: phase.phaseName,
                donorName: contribution.student.fullName,
                donorCode: contribution.student.mssv,
                facultyName: contribution.student.faculty.name,
                contributionType: contribution.contributionType,
                amount: toNumber(contribution.amount),
                itemDescription: contribution.itemDescription ?? null,
                submittedAt: contribution.createdAt,
                status: contribution.status,
                proofFileName: contribution.proofFile?.originalName ?? null,
            }))
    )

    const certificates = campaign.phases.flatMap((phase) =>
        phase.registrations.flatMap((registration) =>
            registration.certificates.map((certificate) => ({
                id: certificate.id,
                registrationId: registration.id,
                studentName: registration.student.fullName,
                phaseId: phase.id,
                phaseName: phase.phaseName,
                deliveryStatus: certificate.deliveryStatus,
                issuedAt: certificate.issuedAt,
                fileName: certificate.file?.originalName ?? null,
            }))
        )
    )

    const approvals = campaign.approvalSteps.map((step) => ({
        id: step.id,
        stepType: step.stepType,
        status: step.status,
        reviewerName: resolveManagerDisplayName(step.reviewer),
        comment: step.comment ?? null,
        reviewedAt: step.reviewedAt,
        createdAt: step.createdAt,
    }))

    const history: OrganizerCampaignHistoryItem[] = campaign.statusHistory.map(
        (item) => ({
            id: item.id,
            statusGroup: item.statusGroup,
            fromStatus: item.fromStatus ?? null,
            toStatus: item.toStatus,
            note: item.note ?? null,
            changedByName: resolveManagerDisplayName(item.changedBy),
            createdAt: item.createdAt,
        })
    )

    return {
        campaign: detail,
        tabs: buildWorkspaceTabs(campaign),
        approvals,
        history,
        registrations,
        contributions,
        certificates,
    }
}

const findOrganizerCampaignOrThrow = async (
    manager: ManagerWithContext,
    campaignId: string
) => {
    const organizer = getManagerContext(manager)
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            AND: [resolveCampaignWhere(organizer), { id: campaignId }],
        },
        select: organizerCampaignSelect,
    })

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    return campaign
}

const findOrganizerCampaignDocumentOrThrow = async (
    manager: ManagerWithContext,
    campaignId: string,
    documentId: string
) => {
    const organizer = getManagerContext(manager)
    const campaignDocument = await prismaClient.campaignFile.findFirst({
        where: {
            id: documentId,
            campaignId,
            campaign: {
                is: resolveCampaignWhere(organizer),
            },
        },
        select: {
            id: true,
            file: {
                select: fileAssetSelect,
            },
        },
    })

    if (!campaignDocument) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign document not found')
    }

    return campaignDocument
}

const findOrganizerCampaignCertificateTemplateOrThrow = async (
    manager: ManagerWithContext,
    campaignId: string,
    phaseId: string
) => {
    const organizer = getManagerContext(manager)
    const phase = await prismaClient.campaignPhase.findFirst({
        where: {
            id: phaseId,
            campaignId,
            campaign: {
                is: resolveCampaignWhere(organizer),
            },
        },
        select: {
            id: true,
            volunteerConfig: {
                select: {
                    phaseId: true,
                    certificateTemplateFile: {
                        select: fileAssetSelect,
                    },
                },
            },
        },
    })

    if (!phase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Campaign phase not found for this campaign'
        )
    }

    return {
        phaseId: phase.id,
        certificateTemplateFile:
            phase.volunteerConfig?.certificateTemplateFile ?? null,
    }
}

const normalizeHexColor = (value: string) => {
    const normalized = value.trim().toUpperCase()
    if (!/^#[0-9A-F]{6}$/.test(normalized)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'fontColorHex must be a valid hex color'
        )
    }

    return normalized
}

const EMAIL_HTML_ALLOWLIST: Record<string, string[]> = {
    div: ['style'],
    p: ['style'],
    span: ['style'],
    strong: ['style'],
    b: ['style'],
    em: ['style'],
    i: ['style'],
    u: ['style'],
    br: [],
    ul: ['style'],
    ol: ['style'],
    li: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    a: ['href', 'target', 'rel', 'style'],
}

const EMAIL_INLINE_CSS_ALLOWLIST = {
    color: true,
    'font-weight': true,
    'font-style': true,
    'font-size': true,
    'text-align': true,
    'text-decoration': true,
    'background-color': true,
    'line-height': true,
}

const decodeBase64Utf8 = (value: string) => {
    const normalized = value.trim()

    if (!normalized) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'htmlContentBase64 is required'
        )
    }

    try {
        return Buffer.from(normalized, 'base64').toString('utf-8')
    } catch {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'htmlContentBase64 is not valid base64'
        )
    }
}

const sanitizeCampaignEmailHtml = (rawHtml: string) => {
    const sanitized = sanitize(rawHtml, {
        whiteList: EMAIL_HTML_ALLOWLIST,
        stripIgnoreTagBody: ['script', 'style'],
        css: {
            whiteList: {
                '*': EMAIL_INLINE_CSS_ALLOWLIST,
            },
        },
        onTagAttr: (tag, name, value) => {
            if (tag === 'a' && name === 'href') {
                const href = value.trim().toLowerCase()
                const isAllowed =
                    href.startsWith('http://') ||
                    href.startsWith('https://') ||
                    href.startsWith('mailto:')

                return isAllowed ? undefined : 'href="#"'
            }

            return undefined
        },
    }).trim()

    if (!sanitized) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Email content is empty after sanitization'
        )
    }

    return sanitized
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

const stripHtml = (value: string) =>
    value
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

const formatPhaseScheduleLabel = (startAt: Date, endAt: Date) => {
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })

    return `${formatter.format(startAt)} - ${formatter.format(endAt)}`
}

const applyCampaignEmailTokens = (
    htmlTemplate: string,
    tokens: Record<string, string>
) => {
    let output = htmlTemplate

    for (const [token, value] of Object.entries(tokens)) {
        output = output.replaceAll(`{{${token}}}`, escapeHtml(value))
    }

    return output
}

const buildCampaignEmailHtml = ({
    campaignTitle,
    phaseName,
    phaseScheduleLabel,
    bodyHtml,
    certificateDownloadUrl,
    certificateFilename,
}: {
    campaignTitle: string
    phaseName: string
    phaseScheduleLabel: string
    bodyHtml: string
    certificateDownloadUrl?: string | null
    certificateFilename?: string | null
}) => {
    const campaignTitleSafe = escapeHtml(campaignTitle)
    const phaseNameSafe = escapeHtml(phaseName)
    const phaseScheduleSafe = escapeHtml(phaseScheduleLabel)
    const certificateDownloadUrlSafe = certificateDownloadUrl
        ? escapeHtml(certificateDownloadUrl)
        : null
    const certificateFilenameSafe = certificateFilename
        ? escapeHtml(certificateFilename)
        : 'Chứng nhận'
    const certificateBoxHtml = certificateDownloadUrlSafe
        ? `
            <div style="margin-top:18px;padding:12px 14px;border-radius:10px;background:#F1F5F9;border:1px solid #CBD5E1;">
                <p style="margin:0;">
                    Bấm vào đây để tải trực tiếp:
                    <a href="${certificateDownloadUrlSafe}" target="_blank" rel="noopener noreferrer" style="color:#1D4ED8;font-weight:600;text-decoration:underline;">${certificateFilenameSafe}</a>
                </p>
            </div>
        `.trim()
        : ''

    return `
        <div style="max-width:680px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
            <div style="margin-bottom:16px;padding:16px;border-radius:12px;background:#F8FAFC;border:1px solid #E2E8F0;">
                <h2 style="margin:0 0 8px 0;color:#0F172A;">${campaignTitleSafe}</h2>
                <p style="margin:0 0 4px 0;"><strong>Giai đoạn:</strong> ${phaseNameSafe}</p>
                <p style="margin:0;"><strong>Thời gian:</strong> ${phaseScheduleSafe}</p>
            </div>
            <div>
                ${bodyHtml}
            </div>
            ${certificateBoxHtml}
        </div>
    `.trim()
}

const normalizeMailHeaderText = (value: string) =>
    value.replace(/[\r\n]+/g, ' ').trim()

const sanitizeSenderName = (value?: string | null) => {
    const normalized = normalizeMailHeaderText(value?.trim() ?? '')

    if (!normalized) {
        return null
    }

    return sanitize(normalized, {
        whiteList: {},
        stripIgnoreTagBody: true,
    }).trim()
}

const sanitizeSenderEmail = (value?: string | null) => {
    const normalized = normalizeMailHeaderText(
        value?.trim().toLowerCase() ?? ''
    )
    return normalized || null
}

const buildFromHeader = (senderName: string, senderEmail: string) => {
    const safeName = senderName.replace(/"/g, '\\"')
    return `"${safeName}" <${senderEmail}>`
}

const extractMailDeliveryError = (error: unknown) => {
    if (!(error instanceof Error)) {
        return 'Unknown email sending error'
    }

    const providerError = error as Error & {
        response?: {
            body?: {
                errors?: Array<{ message?: string }>
            }
        }
    }

    const providerMessage = providerError.response?.body?.errors
        ?.map((item) => item.message?.trim())
        .filter((item): item is string => Boolean(item))
        .join(' | ')

    const message = providerMessage || error.message || 'Unknown email sending error'

    if (
        /verified sender identity|from address does not match/i.test(message)
    ) {
        return 'Sender email is not verified on SendGrid. Please verify sender identity in SendGrid or use a verified EMAIL_FROM.'
    }

    return message
}

const parseDate = (value?: string | null) => {
    if (!value) {
        return null
    }

    const parsed = new Date(value)

    if (Number.isNaN(parsed.getTime())) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid date value')
    }

    return parsed
}

const getTemplateCategories = (
    templateType: CampaignTemplateType
): Set<CampaignCategory> => {
    switch (templateType) {
        case CampaignTemplateType.VOLUNTEER_ONLY:
            return new Set(['volunteer'])
        case CampaignTemplateType.FUNDRAISING_ONLY:
            return new Set(['fundraising'])
        case CampaignTemplateType.ITEM_DONATION_ONLY:
            return new Set(['itemDonation'])
        case CampaignTemplateType.FUNDRAISING_AND_VOLUNTEER:
            return new Set(['fundraising', 'volunteer'])
        case CampaignTemplateType.ITEM_DONATION_AND_VOLUNTEER:
            return new Set(['itemDonation', 'volunteer'])
        case CampaignTemplateType.FUNDRAISING_ITEM_DONATION_AND_VOLUNTEER:
            return new Set(['fundraising', 'itemDonation', 'volunteer'])
        default:
            return new Set<CampaignCategory>()
    }
}

const getPhaseCategory = (phaseType: CampaignPhaseType): CampaignCategory => {
    if (phaseType === CampaignPhaseType.FUNDRAISING) {
        return 'fundraising'
    }

    if (phaseType === CampaignPhaseType.ITEM_DONATION) {
        return 'itemDonation'
    }

    if (VOLUNTEER_PHASE_TYPES.has(phaseType)) {
        return 'volunteer'
    }

    return 'other'
}

const ensureTemplateMatchesPhases = (
    templateType: CampaignTemplateType,
    phases: OrganizerCampaignPhaseInput[]
) => {
    const allowedCategories = getTemplateCategories(templateType)
    const presentCategories = new Set(
        phases.map((phase) => getPhaseCategory(phase.phaseType))
    )

    for (const category of presentCategories) {
        if (!allowedCategories.has(category)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'The selected template does not allow the provided phase set'
            )
        }
    }

    for (const category of allowedCategories) {
        if (!presentCategories.has(category)) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'The selected template is missing one or more required phases'
            )
        }
    }
}

const getAccessibleBankAccounts = async (
    manager: ManagerWithContext
): Promise<OrganizerBankAccountSummary[]> => {
    const accounts = await prismaClient.bankAccount.findMany({
        where: {
            managedByManagerId: manager.id,
            isActive: true,
        },
        orderBy: {
            createdAt: 'asc',
        },
        select: {
            id: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            ownerName: true,
        },
    })

    return accounts.map((item) => ({
        id: item.id,
        bankName: item.bankName,
        accountName: item.accountName,
        accountNumber: item.accountNumber,
        ownerName: item.ownerName,
    }))
}

const normalizeBankAccountDraft = (
    draft?: {
        bankName: string
        accountNumber: string
        ownerName: string
        accountName?: string | null
    } | null
): BankAccountDraft | null => {
    if (!draft) {
        return null
    }

    const bankName = draft.bankName.trim()
    const accountNumber = draft.accountNumber.trim()
    const ownerName = draft.ownerName.trim()
    const accountName =
        toTrimmedNullable(draft.accountName) ?? ownerName

    if (!bankName || !accountNumber || !ownerName) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Fundraising bank information must include bank name, account number and owner name'
        )
    }

    return {
        bankName,
        accountNumber,
        ownerName,
        accountName,
    }
}

const prepareCampaignSaveInput = async (
    manager: ManagerWithContext,
    input: UpsertOrganizerCampaignPayload
): Promise<PreparedCampaignSaveInput> => {
    const title = input.title.trim()
    const slogan = toTrimmedNullable(input.slogan)
    const description = input.description.trim()

    if (!title || !description) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Campaign title and description are required'
        )
    }

    ensureTemplateMatchesPhases(input.templateType, input.phases)

    const accessibleBankAccounts = await getAccessibleBankAccounts(manager)
    const accessibleBankAccountIds = new Set(
        accessibleBankAccounts.map((item) => item.id)
    )
    const allowedParticipantScopes = getAllowedParticipantScopes(manager)
    const allowedParticipantScopeSet = new Set(allowedParticipantScopes)

    const normalizedPhases: PhaseSaveShape[] = input.phases.map((phase) => {
        const startAt = parseDate(phase.startAt)
        const endAt = parseDate(phase.endAt)
        const registrationStartAt = parseDate(phase.registrationStartAt)
        const registrationEndAt = parseDate(phase.registrationEndAt)

        if (!startAt || !endAt) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Each phase must include valid start and end dates'
            )
        }

        if (startAt > endAt) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'A phase cannot end before it starts'
            )
        }

        if (
            registrationStartAt &&
            registrationEndAt &&
            registrationStartAt > registrationEndAt
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Registration end time must be after registration start time'
            )
        }

        if (
            phase.phaseType === CampaignPhaseType.FUNDRAISING &&
            !phase.fundraisingConfig
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Fundraising phases require fundraisingConfig'
            )
        }

        if (
            phase.phaseType === CampaignPhaseType.ITEM_DONATION &&
            !phase.itemDonationConfig
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Item donation phases require itemDonationConfig'
            )
        }

        if (
            VOLUNTEER_PHASE_TYPES.has(phase.phaseType) &&
            !phase.volunteerConfig
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Volunteer phases require volunteerConfig'
            )
        }

        const fundraisingConfig = phase.fundraisingConfig
            ? {
                  targetAmount: phase.fundraisingConfig.targetAmount,
                  bankAccountId: phase.fundraisingConfig.bankAccountId ?? null,
                  bankAccountDraft: normalizeBankAccountDraft(
                      phase.fundraisingConfig.bankAccountDraft
                  ),
                  transferNotePrefix: toTrimmedNullable(
                      phase.fundraisingConfig.transferNotePrefix
                  ),
                  usageDescription: toTrimmedNullable(
                      phase.fundraisingConfig.usageDescription
                  ),
                  verificationMode:
                      phase.fundraisingConfig.verificationMode ??
                      VerificationMode.MANUAL,
              }
            : undefined

        if (
            fundraisingConfig?.bankAccountId &&
            !accessibleBankAccountIds.has(fundraisingConfig.bankAccountId)
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'The selected bank account does not belong to the current organizer'
            )
        }

        if (
            fundraisingConfig &&
            !fundraisingConfig.bankAccountId &&
            !fundraisingConfig.bankAccountDraft
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Fundraising phases require either an existing bank account or new bank information'
            )
        }

        const itemDonationConfig = phase.itemDonationConfig
            ? {
                  collectionAddress:
                      phase.itemDonationConfig.collectionAddress.trim(),
                  collectionNote: toTrimmedNullable(
                      phase.itemDonationConfig.collectionNote
                  ),
                  allowPreRegistration:
                      phase.itemDonationConfig.allowPreRegistration ?? true,
                  acceptedItems: phase.itemDonationConfig.acceptedItems.map(
                      (item) => ({
                          itemName: item.itemName.trim(),
                          description: toTrimmedNullable(item.description),
                      })
                  ),
              }
            : undefined

        const requestedParticipantScope =
            phase.volunteerConfig?.participantScope ??
            allowedParticipantScopes[0] ??
            ParticipantScope.ALL_STUDENTS

        if (
            phase.volunteerConfig &&
            !allowedParticipantScopeSet.has(requestedParticipantScope)
        ) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'The selected participant scope is not available for the current organizer'
            )
        }

        const volunteerConfig = phase.volunteerConfig
            ? {
                  maxParticipants: phase.volunteerConfig.maxParticipants,
                  participantScope: requestedParticipantScope,
                  requiresCheckin: phase.volunteerConfig.requiresCheckin ?? false,
                  taskDescription: toTrimmedNullable(
                      phase.volunteerConfig.taskDescription
                  ),
              }
            : undefined

        return {
            id: phase.id,
            phaseName: phase.phaseName.trim(),
            phaseType: phase.phaseType,
            startAt,
            endAt,
            registrationStartAt,
            registrationEndAt,
            locationText: toTrimmedNullable(phase.locationText),
            fundraisingConfig,
            itemDonationConfig,
            volunteerConfig,
        }
    })

    const derivedPublicFrom =
        parseDate(input.publicFrom) ??
        normalizedPhases.reduce<Date | null>((earliest, phase) => {
            if (!earliest || phase.startAt < earliest) {
                return phase.startAt
            }

            return earliest
        }, null)

    const derivedPublicUntil =
        parseDate(input.publicUntil) ??
        normalizedPhases.reduce<Date | null>((latest, phase) => {
            if (!latest || phase.endAt > latest) {
                return phase.endAt
            }

            return latest
        }, null)

    if (
        derivedPublicFrom &&
        derivedPublicUntil &&
        derivedPublicFrom > derivedPublicUntil
    ) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'publicUntil must be equal to or later than publicFrom'
        )
    }

    return {
        title,
        slogan,
        description,
        templateType: input.templateType,
        publicFrom: derivedPublicFrom,
        publicUntil: derivedPublicUntil,
        phases: normalizedPhases,
    }
}

const resolveFundraisingBankAccountId = async (
    transaction: DbTransaction,
    managerId: string,
    config: NonNullable<PhaseSaveShape['fundraisingConfig']>
) => {
    if (config.bankAccountId) {
        return config.bankAccountId
    }

    if (!config.bankAccountDraft) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Fundraising phases require bank account information'
        )
    }

    const accountName =
        toTrimmedNullable(config.bankAccountDraft.accountName) ??
        config.bankAccountDraft.ownerName

    const existingAccount = await transaction.bankAccount.findFirst({
        where: {
            managedByManagerId: managerId,
            isActive: true,
            bankName: config.bankAccountDraft.bankName,
            accountNumber: config.bankAccountDraft.accountNumber,
            ownerName: config.bankAccountDraft.ownerName,
        },
        select: {
            id: true,
            accountName: true,
        },
    })

    if (existingAccount) {
        if (existingAccount.accountName !== accountName) {
            await transaction.bankAccount.update({
                where: {
                    id: existingAccount.id,
                },
                data: {
                    accountName,
                },
            })
        }

        return existingAccount.id
    }

    const createdAccount = await transaction.bankAccount.create({
        data: {
            bankName: config.bankAccountDraft.bankName,
            accountName,
            accountNumber: config.bankAccountDraft.accountNumber,
            ownerName: config.bankAccountDraft.ownerName,
            managedByManagerId: managerId,
            isActive: true,
        },
        select: {
            id: true,
        },
    })

    return createdAccount.id
}

const upsertPhaseRelations = async (
    transaction: DbTransaction,
    phaseId: string,
    phase: PhaseSaveShape,
    managerId: string
) => {
    if (phase.fundraisingConfig) {
        const bankAccountId = await resolveFundraisingBankAccountId(
            transaction,
            managerId,
            phase.fundraisingConfig
        )

        await transaction.phaseFundraisingConfig.upsert({
            where: {
                phaseId,
            },
            update: {
                targetAmount: phase.fundraisingConfig.targetAmount,
                bankAccountId,
                transferNotePrefix: phase.fundraisingConfig.transferNotePrefix,
                usageDescription: phase.fundraisingConfig.usageDescription,
                verificationMode: phase.fundraisingConfig.verificationMode,
            },
            create: {
                phaseId,
                targetAmount: phase.fundraisingConfig.targetAmount,
                bankAccountId,
                transferNotePrefix: phase.fundraisingConfig.transferNotePrefix,
                usageDescription: phase.fundraisingConfig.usageDescription,
                verificationMode: phase.fundraisingConfig.verificationMode,
            },
        })
    } else {
        await transaction.phaseFundraisingConfig.deleteMany({
            where: {
                phaseId,
            },
        })
    }

    if (phase.itemDonationConfig) {
        await transaction.phaseItemDonationConfig.upsert({
            where: {
                phaseId,
            },
            update: {
                collectionAddress: phase.itemDonationConfig.collectionAddress,
                collectionNote: phase.itemDonationConfig.collectionNote,
                allowPreRegistration:
                    phase.itemDonationConfig.allowPreRegistration,
            },
            create: {
                phaseId,
                collectionAddress: phase.itemDonationConfig.collectionAddress,
                collectionNote: phase.itemDonationConfig.collectionNote,
                allowPreRegistration:
                    phase.itemDonationConfig.allowPreRegistration,
            },
        })

        await transaction.phaseAcceptedItem.deleteMany({
            where: {
                phaseId,
            },
        })

        if (phase.itemDonationConfig.acceptedItems.length > 0) {
            await transaction.phaseAcceptedItem.createMany({
                data: phase.itemDonationConfig.acceptedItems.map((item) => ({
                    phaseId,
                    itemName: item.itemName,
                    description: item.description ?? null,
                })),
            })
        }
    } else {
        await transaction.phaseAcceptedItem.deleteMany({
            where: {
                phaseId,
            },
        })
        await transaction.phaseItemDonationConfig.deleteMany({
            where: {
                phaseId,
            },
        })
    }

    if (phase.volunteerConfig) {
        await transaction.phaseVolunteerConfig.upsert({
            where: {
                phaseId,
            },
            update: {
                maxParticipants: phase.volunteerConfig.maxParticipants,
                participantScope: phase.volunteerConfig.participantScope,
                requiresCheckin: phase.volunteerConfig.requiresCheckin,
                taskDescription: phase.volunteerConfig.taskDescription,
            },
            create: {
                phaseId,
                maxParticipants: phase.volunteerConfig.maxParticipants,
                participantScope: phase.volunteerConfig.participantScope,
                requiresCheckin: phase.volunteerConfig.requiresCheckin,
                taskDescription: phase.volunteerConfig.taskDescription,
            },
        })
    } else {
        await transaction.phaseVolunteerConfig.deleteMany({
            where: {
                phaseId,
            },
        })
    }
}

const syncCampaignPhases = async (
    transaction: DbTransaction,
    campaignId: string,
    phases: PhaseSaveShape[],
    managerId: string
) => {
    const existingPhases = await transaction.campaignPhase.findMany({
        where: {
            campaignId,
        },
        select: {
            id: true,
        },
    })

    const existingPhaseIds = new Set(existingPhases.map((item) => item.id))
    const nextPhaseIds = new Set(
        phases.map((phase) => phase.id).filter(Boolean) as string[]
    )

    for (let index = 0; index < phases.length; index += 1) {
        const phase = phases[index]
        const sharedData = {
            phaseOrder: index + 1,
            phaseName: phase.phaseName,
            phaseType: phase.phaseType,
            startAt: phase.startAt,
            endAt: phase.endAt,
            registrationStartAt: phase.registrationStartAt,
            registrationEndAt: phase.registrationEndAt,
            locationText: phase.locationText,
        }

        let phaseId = phase.id

        if (phaseId && existingPhaseIds.has(phaseId)) {
            await transaction.campaignPhase.update({
                where: {
                    id: phaseId,
                },
                data: sharedData,
            })
        } else {
            const createdPhase = await transaction.campaignPhase.create({
                data: {
                    campaignId,
                    ...sharedData,
                },
                select: {
                    id: true,
                },
            })

            phaseId = createdPhase.id
        }

        await upsertPhaseRelations(transaction, phaseId!, phase, managerId)
    }

    const removablePhaseIds = existingPhases
        .map((item) => item.id)
        .filter((id) => !nextPhaseIds.has(id))

    if (removablePhaseIds.length > 0) {
        await transaction.campaignPhase.deleteMany({
            where: {
                id: {
                    in: removablePhaseIds,
                },
            },
        })
    }
}

const buildCsv = (
    headers: string[],
    rows: Array<Array<string | number | null | undefined>>
) =>
    [headers, ...rows]
        .map((row) =>
            row
                .map((value) => {
                    const normalized = value == null ? '' : String(value)

                    if (/[",\n]/.test(normalized)) {
                        return `"${normalized.replace(/"/g, '""')}"`
                    }

                    return normalized
                })
                .join(',')
        )
        .join('\n')

type ExportReportMode = keyof typeof REPORT_TEMPLATE_BY_MODE

const resolveExportReportMode = (
    phaseType: CampaignPhaseType
): ExportReportMode =>
    phaseType === CampaignPhaseType.FUNDRAISING ? 'fundraising' : 'standard'

const REPORT_SIGN_DATE_PLACEHOLDER = 'Đà Nẵng, ngày... Tháng... năm 202…'

export const resolvePvcdPointByContribution = (amount: number) => {
    if (amount >= 100000) {
        return 10
    }
    if (amount >= 50000) {
        return 8
    }
    if (amount >= 30000) {
        return 7
    }
    if (amount >= 20000) {
        return 5
    }

    return 0
}

const resolveRegistrationStatusLabel = (status: RegistrationStatus) => {
    if (status === RegistrationStatus.APPROVED) {
        return 'Đã duyệt'
    }
    if (status === RegistrationStatus.COMPLETED) {
        return 'Đã hoàn thành'
    }
    if (status === RegistrationStatus.WAITLISTED) {
        return 'Chờ bổ sung'
    }
    if (status === RegistrationStatus.PENDING) {
        return 'Chờ duyệt'
    }
    if (status === RegistrationStatus.REJECTED) {
        return 'Từ chối'
    }

    return 'Đã hủy'
}

const resolveContributionStatusLabel = (status: ContributionStatus) =>
    status === ContributionStatus.VERIFIED ? VERIFIED_MARK : UNVERIFIED_MARK

export const buildReportIssuedDateText = (issuedAt: Date) => {
    const day = String(issuedAt.getDate()).padStart(2, '0')
    const month = String(issuedAt.getMonth() + 1).padStart(2, '0')
    const year = issuedAt.getFullYear()

    return `Đà Nẵng, ngày ${day} tháng ${month} năm ${year}`
}

const resolveOrganizerSignerLabel = (
    manager: ManagerWithContext,
    campaign: FullCampaignRecord
) => {
    if (manager.roleType === ManagerRoleType.LCD_MANAGER) {
        return 'Bí thư Liên Chi Đoàn'
    }

    if (manager.roleType === ManagerRoleType.CLB_MANAGER) {
        const clubName = campaign.club?.name ?? manager.club?.name ?? ''
        return clubName
            ? `Ban Chủ nhiệm Câu lạc bộ ${clubName}`
            : 'Ban Chủ nhiệm Câu lạc bộ'
    }

    return 'Đoàn trường'
}

export const replaceWorkbookPlaceholders = (
    worksheet: ExcelJS.Worksheet,
    replacements: Record<string, string>
) => {
    const replaceText = (input: string) =>
        Object.entries(replacements).reduce(
            (result, [key, value]) => result.replaceAll(key, value),
            input
        )

    worksheet.eachRow((row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
            if (typeof cell.value === 'string') {
                cell.value = replaceText(cell.value)
                return
            }

            if (
                cell.value &&
                typeof cell.value === 'object' &&
                'richText' in cell.value &&
                Array.isArray(cell.value.richText)
            ) {
                cell.value = {
                    richText: cell.value.richText.map((item) => ({
                        ...item,
                        text: replaceText(item.text),
                    })),
                }
            }
        })
    })
}

export const writeReportRows = (
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    rows: Array<Array<string | number>>,
    columnCount: number
) => {
    const templateRow = worksheet.getRow(startRow)
    const templateCellStyles = Array.from({ length: columnCount }, (_, index) => {
        const style = templateRow.getCell(index + 1).style
        return style ? structuredClone(style) : {}
    })
    const templateRowHeight = templateRow.height

    if (rows.length > 1) {
        const rowsToInsert = Array.from({ length: rows.length - 1 }, () => [])
        worksheet.insertRows(startRow + 1, rowsToInsert)
    }

    const thinBorder = {
        style: 'thin' as const,
        color: { argb: 'FF000000' },
    }

    rows.forEach((row, rowIndex) => {
        const worksheetRow = worksheet.getRow(startRow + rowIndex)
        if (templateRowHeight != null) {
            worksheetRow.height = templateRowHeight
        }

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            const cell = worksheetRow.getCell(columnIndex + 1)
            cell.style = structuredClone(templateCellStyles[columnIndex] ?? {})
            cell.value = row[columnIndex] ?? ''
            cell.border = {
                top: thinBorder,
                right: thinBorder,
                bottom: thinBorder,
                left: thinBorder,
            }
        }

        worksheetRow.commit()
    })
}

const buildReportFilename = (
    mode: ExportReportMode,
    campaignTitle: string,
    unitName: string
) => {
    const rawTitle =
        mode === 'fundraising'
            ? `DANH SÁCH SV THAM GIA ${campaignTitle} GÂY QUỸ ONLINE - ${unitName}`
            : `DANH SÁCH SV THAM GIA ${campaignTitle} - ${unitName}`

    const normalized = sanitizeFilename(rawTitle)
    return `${normalized || 'bao-cao-sinh-vien'}.xlsx`
}

const mapDraftCampaign = (
    campaign: campaignRepository.CampaignDraftRecord
): CampaignDraftResponse => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    organizerType: campaign.organizerType,
    approvalStatus: campaign.approvalStatus,
    publicationStatus: campaign.publicationStatus,
    creatorManagerId: campaign.creatorManagerId,
    facultyId: campaign.facultyId ?? null,
    facultyName: campaign.faculty?.name ?? null,
    clubId: campaign.clubId ?? null,
    clubName: campaign.club?.name ?? null,
    attachments: campaign.campaignFiles.map((attachment) => ({
        id: attachment.id,
        fileId: attachment.fileId,
        fileType: attachment.fileType,
        originalName: attachment.file.originalName,
        mimeType: attachment.file.mimeType,
        fileSize: Number(attachment.file.fileSize),
        createdAt: attachment.createdAt,
    })),
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
})

export const getDraftBootstrap = async (
    payload?: JwtPayload
): Promise<CampaignDraftBootstrapResponse> => {
    const manager = await getManagerOrThrow(payload)
    const organizer = getManagerContext(manager)

    return {
        manager: {
            id: manager.id,
            roleType: manager.roleType,
            status: manager.status,
        },
        organizer,
        draftDefaults: {
            approvalStatus: CampaignApprovalStatus.DRAFT,
            publicationStatus: CampaignPublicationStatus.NOT_PUBLIC,
        },
        fieldPolicy: {
            requiredFields: ['title'],
            optionalFields: ['description', 'attachments'],
            supportsAttachments: true,
        },
    }
}

export const createDraftCampaign = async (
    payload: JwtPayload | undefined,
    input: CreateDraftCampaignPayload
): Promise<CampaignDraftResponse> => {
    const manager = await getManagerOrThrow(payload)
    const organizer = getManagerContext(manager)
    const title = input.title.trim()
    const description =
        input.description?.trim() || DEFAULT_DRAFT_DESCRIPTION

    if (!title) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Campaign title is required'
        )
    }

    const campaign = await campaignRepository.createDraftCampaign({
        title,
        description,
        creatorManagerId: manager.id,
        organizerType: organizer.type,
        facultyId: organizer.facultyId,
        clubId: organizer.clubId,
    })

    return mapDraftCampaign(campaign)
}

export const getDraftCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<CampaignDraftResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await campaignRepository.getDraftCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign draft not found')
    }

    if (campaign.creatorManagerId !== manager.id) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'You can only view drafts that you created'
        )
    }

    return mapDraftCampaign(campaign)
}

export const updateDraftCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: UpdateDraftCampaignPayload
): Promise<CampaignDraftResponse> => {
    const manager = await getManagerOrThrow(payload)
    const existingCampaign =
        await campaignRepository.getDraftCampaignById(campaignId)

    if (!existingCampaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign draft not found')
    }

    if (existingCampaign.creatorManagerId !== manager.id) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'You can only update drafts that you created'
        )
    }

    if (existingCampaign.approvalStatus !== CampaignApprovalStatus.DRAFT) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only campaigns in draft status can be updated here'
        )
    }

    const title = input.title.trim()
    const description =
        input.description?.trim() || DEFAULT_DRAFT_DESCRIPTION

    if (!title) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Campaign title is required'
        )
    }

    const campaign = await campaignRepository.updateDraftCampaign(campaignId, {
        title,
        description,
    })

    return mapDraftCampaign(campaign)
}

export const getOrganizerCampaignBootstrap = async (
    payload?: JwtPayload
): Promise<OrganizerCampaignBootstrapResponse> => {
    const manager = await getManagerOrThrow(payload)
    const organizer = getManagerContext(manager)
    const bankAccounts = await getAccessibleBankAccounts(manager)

    return {
        manager: {
            id: manager.id,
            roleType: manager.roleType,
            status: manager.status,
        },
        organizer,
        templates: TEMPLATE_DEFINITIONS,
        bankAccounts,
        policies: {
            allowOwnershipSelection: false,
            allowFacultySelection: false,
            lockedParticipantScope: null,
            canPublishApprovedCampaigns: true,
        },
    }
}

export const listOrganizerCampaigns = async (
    payload?: JwtPayload
): Promise<OrganizerCampaignListResponse> => {
    const manager = await getManagerOrThrow(payload)
    const organizer = getManagerContext(manager)
    const campaigns = await prismaClient.campaign.findMany({
        where: resolveCampaignWhere(organizer),
        orderBy: {
            updatedAt: 'desc',
        },
        select: organizerCampaignSelect,
    })

    return {
        campaigns: campaigns.map((campaign) =>
            mapCampaignListItem(campaign, manager)
        ),
    }
}

export const getOrganizerCampaignDetail = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<OrganizerCampaignDetailResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    return mapCampaignDetail(campaign, manager)
}

export const createOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    input: UpsertOrganizerCampaignPayload
): Promise<OrganizerCampaignDetailResponse> => {
    const manager = await getManagerOrThrow(payload)
    const organizer = getManagerContext(manager)
    const prepared = await prepareCampaignSaveInput(manager, input)

    const createdCampaign = await prismaClient.$transaction(
        async (transaction) => {
            const campaign = await transaction.campaign.create({
                data: {
                    title: prepared.title,
                    slogan: prepared.slogan,
                    description: prepared.description,
                    creatorManagerId: manager.id,
                    organizerType: organizer.type,
                    templateType: prepared.templateType,
                    facultyId: organizer.facultyId,
                    clubId: organizer.clubId,
                    approvalStatus: CampaignApprovalStatus.DRAFT,
                    publicationStatus: CampaignPublicationStatus.NOT_PUBLIC,
                    publicFrom: prepared.publicFrom,
                    publicUntil: prepared.publicUntil,
                    statusHistory: {
                        create: [
                            {
                                statusGroup: CampaignStatusGroup.APPROVAL,
                                fromStatus: null,
                                toStatus: CampaignApprovalStatus.DRAFT,
                                changedById: manager.id,
                                note: 'Campaign draft created from organizer wizard',
                            },
                            {
                                statusGroup: CampaignStatusGroup.PUBLICATION,
                                fromStatus: null,
                                toStatus: CampaignPublicationStatus.NOT_PUBLIC,
                                changedById: manager.id,
                                note: 'Campaign draft created from organizer wizard',
                            },
                        ],
                    },
                },
                select: {
                    id: true,
                },
            })

            await syncCampaignPhases(
                transaction,
                campaign.id,
                prepared.phases,
                manager.id
            )

            return transaction.campaign.findUniqueOrThrow({
                where: {
                    id: campaign.id,
                },
                select: organizerCampaignSelect,
            })
        }
    )

    return mapCampaignDetail(createdCampaign, manager)
}

export const updateOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: UpsertOrganizerCampaignPayload
): Promise<OrganizerCampaignDetailResponse> => {
    const manager = await getManagerOrThrow(payload)
    const currentCampaign = await findOrganizerCampaignOrThrow(
        manager,
        campaignId
    )

    if (!EDITABLE_APPROVAL_STATUSES.has(currentCampaign.approvalStatus)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only draft, revision-required or rejected campaigns can be updated'
        )
    }

    const prepared = await prepareCampaignSaveInput(manager, input)

    const updatedCampaign = await prismaClient.$transaction(
        async (transaction) => {
            await transaction.campaign.update({
                where: {
                    id: campaignId,
                },
                data: {
                    title: prepared.title,
                    slogan: prepared.slogan,
                    description: prepared.description,
                    templateType: prepared.templateType,
                    publicFrom: prepared.publicFrom,
                    publicUntil: prepared.publicUntil,
                },
            })

            await syncCampaignPhases(
                transaction,
                campaignId,
                prepared.phases,
                manager.id
            )

            return transaction.campaign.findUniqueOrThrow({
                where: {
                    id: campaignId,
                },
                select: organizerCampaignSelect,
            })
        }
    )

    return mapCampaignDetail(updatedCampaign, manager)
}

export const deleteOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
) => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    if (!EDITABLE_APPROVAL_STATUSES.has(campaign.approvalStatus)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only draft, revision-required or rejected campaigns can be deleted'
        )
    }

    await prismaClient.campaign.delete({
        where: {
            id: campaignId,
        },
    })

    return {
        id: campaignId,
    }
}

export const getOrganizerCampaignWorkspace = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<OrganizerCampaignWorkspaceResponse> => {
    const manager = await getManagerOrThrow(payload)
    let campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    const syncResult = await ensureVerifiedFundraisingContributionRegistrations(
        campaign.id,
        manager.id
    )

    if (syncResult.createdCount > 0 || syncResult.updatedCount > 0) {
        campaign = await findOrganizerCampaignOrThrow(manager, campaignId)
    }

    return buildWorkspace(campaign, manager)
}

export const getOrganizerCampaignDocumentDownload = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    documentId: string
) => {
    const manager = await getManagerOrThrow(payload)
    const campaignDocument = await findOrganizerCampaignDocumentOrThrow(
        manager,
        campaignId,
        documentId
    )
    const file = campaignDocument.file
    const url =
        resolveSignedCloudinaryDownloadUrl(
            file.storageKey,
            file.mimeType,
            file.originalName
        ) ??
        resolveCloudinaryUrl(file.storageKey, file.mimeType, file.originalName)

    if (!url) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Cloudinary is not configured'
        )
    }

    const fallbackUrl = resolveCloudinaryUrl(
        file.storageKey,
        file.mimeType,
        file.originalName
    )

    return {
        url,
        fallbackUrl,
        originalName: ensureFilenameWithExtension(
            file.originalName,
            file.mimeType,
            'tai-lieu'
        ),
        mimeType: file.mimeType,
    }
}

export const getOrganizerCampaignCertificateTemplateDownload = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    phaseId: string
) => {
    const manager = await getManagerOrThrow(payload)
    const phaseConfig = await findOrganizerCampaignCertificateTemplateOrThrow(
        manager,
        campaignId,
        phaseId
    )
    const file = phaseConfig.certificateTemplateFile
    if (!file) {
        return null
    }
    const url =
        resolveSignedCloudinaryDownloadUrl(
            file.storageKey,
            file.mimeType,
            file.originalName
        ) ??
        resolveCloudinaryUrl(file.storageKey, file.mimeType, file.originalName)

    if (!url) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Cloudinary is not configured'
        )
    }

    const fallbackUrl = resolveCloudinaryUrl(
        file.storageKey,
        file.mimeType,
        file.originalName
    )

    return {
        url,
        fallbackUrl,
        originalName: ensureFilenameWithExtension(
            file.originalName,
            file.mimeType,
            'phoi-chung-nhan'
        ),
        mimeType: file.mimeType,
    }
}

export const updateCampaignCertificateLayout = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: UpdateCampaignCertificateLayoutPayload
): Promise<CampaignCertificateLayoutResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    if (campaign.publicationStatus !== CampaignPublicationStatus.ENDED) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Certificate layout can only be configured after campaign has ended'
        )
    }

    const targetPhase = campaign.phases.find((phase) => phase.id === input.phaseId)

    if (!targetPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Campaign phase not found for this campaign'
        )
    }

    const updated = await prismaClient.phaseVolunteerConfig.upsert({
        where: {
            phaseId: input.phaseId,
        },
        create: {
            phaseId: input.phaseId,
            certificateNamePosXPercent: new Prisma.Decimal(input.namePosXPercent),
            certificateNamePosYPercent: new Prisma.Decimal(input.namePosYPercent),
            certificateNameFontSize: input.fontSize,
            certificateNameColorHex: normalizeHexColor(input.fontColorHex),
        },
        update: {
            certificateNamePosXPercent: new Prisma.Decimal(input.namePosXPercent),
            certificateNamePosYPercent: new Prisma.Decimal(input.namePosYPercent),
            certificateNameFontSize: input.fontSize,
            certificateNameColorHex: normalizeHexColor(input.fontColorHex),
        },
        select: {
            phaseId: true,
            certificateNamePosXPercent: true,
            certificateNamePosYPercent: true,
            certificateNameFontSize: true,
            certificateNameColorHex: true,
            certificateTemplateFile: {
                select: fileAssetSelect,
            },
        },
    })

    return {
        campaignId,
        phaseId: updated.phaseId,
        certificateTemplateFile: mapFileAsset(updated.certificateTemplateFile),
        namePosXPercent: toNumber(updated.certificateNamePosXPercent),
        namePosYPercent: toNumber(updated.certificateNamePosYPercent),
        fontSize: updated.certificateNameFontSize,
        fontColorHex: updated.certificateNameColorHex,
    }
}

export const upsertGeneratedCampaignCertificates = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: UpsertGeneratedCampaignCertificatesPayload
): Promise<UpsertGeneratedCampaignCertificatesResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    if (campaign.publicationStatus !== CampaignPublicationStatus.ENDED) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Certificates can only be generated after campaign has ended'
        )
    }

    const targetPhase = campaign.phases.find((phase) => phase.id === input.phaseId)
    if (!targetPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Campaign phase not found for this campaign'
        )
    }

    await ensureVerifiedFundraisingContributionRegistrations(
        campaign.id,
        manager.id,
        input.phaseId
    )

    const dedupedItemsMap = new Map<
        string,
        { registrationId: string; fileId: string }
    >()
    input.items.forEach((item) => {
        dedupedItemsMap.set(item.registrationId, {
            registrationId: item.registrationId,
            fileId: item.fileId,
        })
    })
    const dedupedItems = Array.from(dedupedItemsMap.values())
    const registrationIds = dedupedItems.map((item) => item.registrationId)
    const fileIds = Array.from(new Set(dedupedItems.map((item) => item.fileId)))

    const [registrations, files, existingCertificates] = await Promise.all([
        prismaClient.registration.findMany({
            where: {
                id: {
                    in: registrationIds,
                },
                phaseId: input.phaseId,
                phase: {
                    campaignId,
                },
                status: {
                    in: [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED],
                },
            },
            select: {
                id: true,
            },
        }),
        prismaClient.file.findMany({
            where: {
                id: {
                    in: fileIds,
                },
            },
            select: {
                id: true,
                mimeType: true,
            },
        }),
        prismaClient.certificate.findMany({
            where: {
                registrationId: {
                    in: registrationIds,
                },
            },
            orderBy: [
                {
                    registrationId: 'asc',
                },
                {
                    issuedAt: 'desc',
                },
            ],
            select: {
                id: true,
                registrationId: true,
            },
        }),
    ])

    if (registrations.length !== registrationIds.length) {
        const foundIds = new Set(registrations.map((item) => item.id))
        const missingIds = registrationIds.filter((id) => !foundIds.has(id))
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            `Some registrations are not eligible for certificate saving: ${missingIds.join(', ')}`
        )
    }

    if (files.length !== fileIds.length) {
        const foundFileIds = new Set(files.map((item) => item.id))
        const missingFileIds = fileIds.filter((id) => !foundFileIds.has(id))
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            `Some uploaded files cannot be found: ${missingFileIds.join(', ')}`
        )
    }

    const filesById = new Map(files.map((item) => [item.id, item]))
    const invalidFileIds = dedupedItems
        .filter((item) => {
            const file = filesById.get(item.fileId)
            return !file
                ? true
                : !(
                      file.mimeType === 'application/pdf' ||
                      file.mimeType.startsWith('image/')
                  )
        })
        .map((item) => item.fileId)
    if (invalidFileIds.length > 0) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `Certificate files must be PDF or image. Invalid fileIds: ${Array.from(new Set(invalidFileIds)).join(', ')}`
        )
    }

    const latestCertificateByRegistrationId = new Map<
        string,
        { id: string; registrationId: string }
    >()
    existingCertificates.forEach((certificate) => {
        if (!latestCertificateByRegistrationId.has(certificate.registrationId)) {
            latestCertificateByRegistrationId.set(
                certificate.registrationId,
                certificate
            )
        }
    })

    let createdCount = 0
    let updatedCount = 0
    const savedItems: UpsertGeneratedCampaignCertificatesResponse['items'] = []

    await prismaClient.$transaction(async (transaction) => {
        for (const item of dedupedItems) {
            const existingCertificate = latestCertificateByRegistrationId.get(
                item.registrationId
            )

            if (existingCertificate) {
                const updatedCertificate = await transaction.certificate.update({
                    where: {
                        id: existingCertificate.id,
                    },
                    data: {
                        fileId: item.fileId,
                        issuedById: manager.id,
                        issuedAt: new Date(),
                        deliveryStatus: CertificateDeliveryStatus.PENDING,
                        emailSentAt: null,
                    },
                    select: {
                        id: true,
                    },
                })

                updatedCount += 1
                savedItems.push({
                    registrationId: item.registrationId,
                    certificateId: updatedCertificate.id,
                    fileId: item.fileId,
                    action: 'updated',
                })
                continue
            }

            const createdCertificate = await transaction.certificate.create({
                data: {
                    registrationId: item.registrationId,
                    fileId: item.fileId,
                    issuedById: manager.id,
                    deliveryStatus: CertificateDeliveryStatus.PENDING,
                },
                select: {
                    id: true,
                },
            })

            createdCount += 1
            savedItems.push({
                registrationId: item.registrationId,
                certificateId: createdCertificate.id,
                fileId: item.fileId,
                action: 'created',
            })
        }
    })

    return {
        campaignId,
        phaseId: input.phaseId,
        savedCount: savedItems.length,
        createdCount,
        updatedCount,
        items: savedItems,
    }
}

export const sendCampaignCertificateEmails = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: SendCampaignCertificateEmailsPayload
): Promise<SendCampaignCertificateEmailsResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    if (campaign.publicationStatus !== CampaignPublicationStatus.ENDED) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Emails can only be sent after campaign has ended'
        )
    }

    const targetPhase = campaign.phases.find((phase) => phase.id === input.phaseId)

    if (!targetPhase) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Campaign phase not found for this campaign'
        )
    }

    await ensureVerifiedFundraisingContributionRegistrations(
        campaign.id,
        manager.id,
        input.phaseId
    )

    const hasSendGridConfig = config.sendgrid.is_configured
    const hasCustomSmtpConfig =
        config.email.smtp.host !== 'localhost' &&
        config.email.smtp.auth.username !== 'test_user' &&
        config.email.smtp.auth.password !== 'test_password'

    if (!hasSendGridConfig && !hasCustomSmtpConfig) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Email is not configured for real delivery. Please configure SENDGRID_API_KEY or SMTP_HOST/SMTP_PORT/SMTP_USERNAME/SMTP_PASSWORD in backend .env'
        )
    }

    const registrationIds = input.registrationIds
        ? Array.from(new Set(input.registrationIds))
        : null

    const recipients = await prismaClient.registration.findMany({
        where: {
            phaseId: input.phaseId,
            phase: {
                campaignId,
            },
            status: {
                in: [RegistrationStatus.APPROVED, RegistrationStatus.COMPLETED],
            },
            ...(registrationIds
                ? {
                      id: {
                          in: registrationIds,
                      },
                  }
                : {}),
        },
        select: {
            id: true,
            student: {
                select: {
                    id: true,
                    fullName: true,
                    mssv: true,
                    email: true,
                },
            },
            certificates: {
                orderBy: {
                    issuedAt: 'desc',
                },
                take: 1,
                select: {
                    id: true,
                    file: {
                        select: {
                            storageKey: true,
                            originalName: true,
                            mimeType: true,
                        },
                    },
                },
            },
        },
    })

    if (registrationIds && recipients.length !== registrationIds.length) {
        const foundIds = new Set(recipients.map((item) => item.id))
        const missingIds = registrationIds.filter((id) => !foundIds.has(id))

        throw new ApiError(
            HttpStatus.NOT_FOUND,
            `Some registrations are not eligible for email sending: ${missingIds.join(', ')}`
        )
    }

    if (recipients.length === 0) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'No eligible students found for sending email'
        )
    }

    const decodedHtml = decodeBase64Utf8(input.htmlContentBase64)
    const sanitizedTemplateHtml = sanitizeCampaignEmailHtml(decodedHtml)
    const sanitizedSubject = normalizeMailHeaderText(
        sanitize(input.subject, {
            whiteList: {},
            stripIgnoreTagBody: true,
        })
    ).trim()

    if (!sanitizedSubject) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Email subject is required')
    }

    const defaultSenderName =
        sanitizeSenderName(manager.username) ?? 'Đơn vị tổ chức'
    const configuredFromEmail = sanitizeSenderEmail(config.email.from)
    const requestedSenderEmail = sanitizeSenderEmail(input.senderEmail)
    const isDefaultEmailFrom =
        configuredFromEmail?.toLowerCase() === 'test@example.com'
    if (config.sendgrid.is_configured && isDefaultEmailFrom && !requestedSenderEmail) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'EMAIL_FROM is still test@example.com. Please configure a verified EMAIL_FROM in backend .env or provide senderEmail in the request.'
        )
    }

    const defaultSenderEmail =
        sanitizeSenderEmail(manager.email) ?? configuredFromEmail
    const senderName = sanitizeSenderName(input.senderName) ?? defaultSenderName
    const senderEmail = requestedSenderEmail ?? defaultSenderEmail
    if (!senderEmail) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Sender email is required. Please provide senderEmail or configure EMAIL_FROM in backend .env'
        )
    }

    const senderFromHeader = buildFromHeader(senderName, senderEmail)
    const systemFromEmail = configuredFromEmail ?? senderEmail
    const useFallbackFrom =
        senderEmail.toLowerCase() !== systemFromEmail.toLowerCase()

    const phaseScheduleLabel = formatPhaseScheduleLabel(
        targetPhase.startAt,
        targetPhase.endAt
    )

    const sentRecipients: SendCampaignCertificateEmailsResponse['sentRecipients'] = []
    const failedRecipients: SendCampaignCertificateEmailsResponse['failedRecipients'] =
        []
    const sentRegistrationIds: string[] = []
    const failedRegistrationIds: string[] = []
    const phaseTemplateFile =
        targetPhase.volunteerConfig?.certificateTemplateFile ?? null

    for (const recipient of recipients) {
        const bodyWithTokens = applyCampaignEmailTokens(sanitizedTemplateHtml, {
            TEN_SU_KIEN: campaign.title,
            GIAI_DOAN: targetPhase.phaseName,
            THOI_GIAN_GIAI_DOAN: phaseScheduleLabel,
            HO_TEN: recipient.student.fullName,
            MSSV: recipient.student.mssv,
        })

        try {
            const latestCertificate = recipient.certificates[0]
            const attachmentSource = latestCertificate?.file ?? phaseTemplateFile
            if (!attachmentSource) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    `Certificate file is missing for student ${recipient.student.mssv}. Please upload certificate template or generate certificate file first.`
                )
            }

            const attachmentMimeType =
                attachmentSource.mimeType || 'application/octet-stream'
            const attachmentFilename = ensureFilenameWithExtension(
                attachmentSource.originalName,
                attachmentMimeType,
                `${recipient.student.mssv}-chung-nhan`
            )
            const safeAsciiFilename =
                toSafeAsciiFilename(attachmentFilename) ||
                `${recipient.student.mssv}-chung-nhan.${resolveFileExtension(
                    attachmentFilename,
                    attachmentMimeType
                )}`
            const certificateDownloadUrl =
                resolveSignedCloudinaryDownloadUrl(
                    attachmentSource.storageKey,
                    attachmentMimeType,
                    attachmentFilename,
                    60 * 60 * 24 * 14
                ) ??
                resolveCloudinaryUrl(
                    attachmentSource.storageKey,
                    attachmentMimeType,
                    attachmentFilename
                )
            if (!certificateDownloadUrl) {
                throw new ApiError(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    'Cannot generate certificate download link'
                )
            }
            const emailHtml = buildCampaignEmailHtml({
                campaignTitle: campaign.title,
                phaseName: targetPhase.phaseName,
                phaseScheduleLabel,
                bodyHtml: bodyWithTokens,
                certificateDownloadUrl,
                certificateFilename: safeAsciiFilename,
            })
            const emailText = `${stripHtml(emailHtml)}\n\nTai truc tiep chung nhan: ${certificateDownloadUrl}`

            try {
                await transporter.sendMail({
                    from: senderFromHeader,
                    replyTo: senderEmail,
                    to: recipient.student.email,
                    subject: sanitizedSubject,
                    html: emailHtml,
                    text: emailText,
                })
            } catch (sendError) {
                if (!useFallbackFrom) {
                    throw sendError
                }

                await transporter.sendMail({
                    from: systemFromEmail,
                    replyTo: senderEmail,
                    to: recipient.student.email,
                    subject: sanitizedSubject,
                    html: emailHtml,
                    text: emailText,
                })
            }

            sentRegistrationIds.push(recipient.id)
            sentRecipients.push({
                registrationId: recipient.id,
                studentName: recipient.student.fullName,
                studentCode: recipient.student.mssv,
                studentEmail: recipient.student.email,
            })
        } catch (error) {
            failedRegistrationIds.push(recipient.id)
            failedRecipients.push({
                registrationId: recipient.id,
                studentName: recipient.student.fullName,
                studentCode: recipient.student.mssv,
                studentEmail: recipient.student.email,
                reason: extractMailDeliveryError(error),
            })
        }
    }

    if (sentRegistrationIds.length > 0 || failedRegistrationIds.length > 0) {
        const sentRecipientStudentIds = recipients
            .filter((recipient) => sentRegistrationIds.includes(recipient.id))
            .map((recipient) => recipient.student.id)

        await prismaClient.$transaction(async (transaction) => {
            if (sentRegistrationIds.length > 0) {
                await transaction.certificate.updateMany({
                    where: {
                        registrationId: {
                            in: sentRegistrationIds,
                        },
                    },
                    data: {
                        deliveryStatus: CertificateDeliveryStatus.SENT,
                        emailSentAt: new Date(),
                    },
                })
            }

            if (failedRegistrationIds.length > 0) {
                await transaction.certificate.updateMany({
                    where: {
                        registrationId: {
                            in: failedRegistrationIds,
                        },
                    },
                    data: {
                        deliveryStatus: CertificateDeliveryStatus.FAILED,
                    },
                })
            }

            if (sentRecipientStudentIds.length > 0) {
                await transaction.notificationStudent.createMany({
                    data: sentRecipientStudentIds.map((studentId) => ({
                        studentId,
                        type: NotificationType.CERTIFICATE,
                        title: `Email từ chiến dịch ${campaign.title}`,
                        message: `Bạn đã nhận email từ đơn vị tổ chức cho giai đoạn ${targetPhase.phaseName}.`,
                        targetType: NotificationTargetType.PHASE,
                        targetId: input.phaseId,
                    })),
                })
            }
        })
    }

    return {
        campaignId,
        phaseId: input.phaseId,
        senderName,
        senderEmail,
        subject: sanitizedSubject,
        recipientCount: recipients.length,
        sentCount: sentRecipients.length,
        failedCount: failedRecipients.length,
        sentRecipients,
        failedRecipients,
    }
}

export const submitOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<CampaignActionResponse> =>
    managerWorkspaceService.submitCampaign(
        payload,
        campaignId
    ) as Promise<CampaignActionResponse>

export const approveOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<CampaignActionResponse> =>
    managerWorkspaceService.approveCampaign(
        payload,
        campaignId
    ) as Promise<CampaignActionResponse>

export const publishOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string
): Promise<CampaignActionResponse> =>
    managerWorkspaceService.publishCampaign(
        payload,
        campaignId
    ) as Promise<CampaignActionResponse>

export const updateCampaignLifecycle = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: CampaignLifecyclePayload
): Promise<CampaignActionResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)

    if (campaign.approvalStatus !== CampaignApprovalStatus.APPROVED) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Only approved campaigns can change lifecycle status'
        )
    }

    let nextPublicationStatus: CampaignPublicationStatus

    if (input.action === 'pause') {
        if (!PAUSABLE_STATUSES.has(campaign.publicationStatus)) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Only active campaigns can be paused'
            )
        }

        nextPublicationStatus = CampaignPublicationStatus.PAUSED
    } else if (input.action === 'resume') {
        if (campaign.publicationStatus !== CampaignPublicationStatus.PAUSED) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Only paused campaigns can be resumed'
            )
        }

        const latestPauseTransition =
            await prismaClient.campaignStatusHistory.findFirst({
                where: {
                    campaignId,
                    statusGroup: CampaignStatusGroup.PUBLICATION,
                    toStatus: CampaignPublicationStatus.PAUSED,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    fromStatus: true,
                },
            })

        const previousPublicationStatus =
            latestPauseTransition?.fromStatus as CampaignPublicationStatus | null

        nextPublicationStatus =
            previousPublicationStatus &&
            RESUMABLE_PUBLICATION_STATUSES.has(previousPublicationStatus)
                ? previousPublicationStatus
                : getPublishStatus(campaign)
    } else {
        if (
            !ACTIVE_PUBLICATION_STATUSES.has(campaign.publicationStatus) &&
            campaign.publicationStatus !== CampaignPublicationStatus.PUBLISHED
        ) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Only published or active campaigns can be ended'
            )
        }

        nextPublicationStatus = CampaignPublicationStatus.ENDED
    }

    return prismaClient.$transaction(async (transaction) => {
        const updatedCampaign = await transaction.campaign.update({
            where: {
                id: campaignId,
            },
            data: {
                publicationStatus: nextPublicationStatus,
            },
            select: {
                id: true,
                approvalStatus: true,
                publicationStatus: true,
            },
        })

        if (input.action === 'end') {
            await transaction.campaignPhase.updateMany({
                where: {
                    campaignId,
                    status: {
                        notIn: ['ENDED', 'CANCELLED'],
                    },
                },
                data: {
                    status: 'ENDED',
                },
            })
        }

        await transaction.campaignStatusHistory.create({
            data: {
                campaignId,
                statusGroup: CampaignStatusGroup.PUBLICATION,
                fromStatus: campaign.publicationStatus,
                toStatus: nextPublicationStatus,
                changedById: manager.id,
                note:
                    input.action === 'pause'
                        ? 'Campaign paused from organizer workspace'
                        : input.action === 'resume'
                          ? 'Campaign resumed from organizer workspace'
                          : 'Campaign ended from organizer workspace',
            },
        })

        return updatedCampaign
    })
}

export const exportOrganizerCampaign = async (
    payload: JwtPayload | undefined,
    campaignId: string,
    input: ExportOrganizerCampaignPayload
): Promise<CampaignExportResponse> => {
    const manager = await getManagerOrThrow(payload)
    const campaign = await findOrganizerCampaignOrThrow(manager, campaignId)
    const unitName = input.unitName.trim()
    const signerName = input.signerName.trim()
    const preparedByName = input.preparedByName.trim()
    const issuedAt = new Date()
    const issuedDateText = buildReportIssuedDateText(issuedAt)
    const signerRoleLabel = resolveOrganizerSignerLabel(manager, campaign)

    const phase = campaign.phases.find((item) => item.id === input.phaseId)
    if (!phase) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign phase not found')
    }

    const exportMode = resolveExportReportMode(phase.phaseType)
    const workbook = new ExcelJS.Workbook()
    const templatePath = path.join(
        REPORT_TEMPLATE_DIRECTORY,
        REPORT_TEMPLATE_BY_MODE[exportMode]
    )

    try {
        await workbook.xlsx.readFile(templatePath)
    } catch {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Report template is unavailable'
        )
    }

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Report template sheet is missing'
        )
    }

    const campaignTitleForReport =
        exportMode === 'fundraising'
            ? `${campaign.title} GÂY QUỸ ONLINE - ${unitName}`
            : `${campaign.title} - ${unitName}`

    replaceWorkbookPlaceholders(worksheet, {
        '[TÊN ĐƠN VỊ]': unitName,
        '[TÊN CHIẾN DỊCH]': campaignTitleForReport,
        '[BÍ THƯ BCH / BCN CLB / ĐOÀN TRƯỜNG]': signerRoleLabel,
        '[HỌ VÀ TÊN]': preparedByName,
        [REPORT_SIGN_DATE_PLACEHOLDER]: issuedDateText,
    })

    if (exportMode === 'fundraising') {
        worksheet.getCell('E26').value = signerName
        worksheet.getCell('A26').value = preparedByName
    } else {
        worksheet.getCell('E18').value = signerName
        worksheet.getCell('A18').value = preparedByName
    }

    const reportRows =
        exportMode === 'fundraising'
            ? phase.contributions
                  .filter(
                      (contribution) =>
                          contribution.contributionType === ContributionType.MONEY
                  )
                  .sort((left, right) =>
                      left.student.fullName.localeCompare(
                          right.student.fullName,
                          'vi'
                      )
                  )
                  .map((contribution, index) => {
                      const amount = toNumber(contribution.amount)
                      const statusLabel = resolveContributionStatusLabel(
                          contribution.status
                      )
                      return [
                          index + 1,
                          contribution.student.mssv,
                          contribution.student.fullName,
                          contribution.student.className ?? '',
                          amount,
                          resolvePvcdPointByContribution(amount),
                          statusLabel,
                      ]
                  })
            : phase.registrations
                  .sort((left, right) =>
                      left.student.fullName.localeCompare(
                          right.student.fullName,
                          'vi'
                      )
                  )
                  .map((registration, index) => [
                      index + 1,
                      registration.student.mssv,
                      registration.student.fullName,
                      registration.student.className ?? '',
                      registration.student.email,
                      registration.student.phone ?? '',
                      resolveRegistrationStatusLabel(registration.status),
                  ])

    const populatedRows =
        reportRows.length > 0
            ? reportRows
            : exportMode === 'fundraising'
              ? [[1, '', 'Chưa có dữ liệu đóng góp', '', 0, 0, UNVERIFIED_MARK]]
              : [
                    [
                        1,
                        '',
                        'Chưa có sinh viên tham gia',
                        '',
                        '',
                        '',
                        'Chờ cập nhật dữ liệu',
                    ],
                ]

    writeReportRows(
        worksheet,
        REPORT_DATA_START_ROW[exportMode],
        populatedRows as Array<Array<string | number>>,
        7
    )

    const reportBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.isBuffer(reportBuffer)
        ? reportBuffer
        : Buffer.from(reportBuffer)

    return {
        filename: buildReportFilename(exportMode, campaign.title, unitName),
        contentType: EXCEL_REPORT_CONTENT_TYPE,
        content: buffer.toString('base64'),
        encoding: 'base64',
    }
}
