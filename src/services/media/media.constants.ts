export const mediaUseCases = [
    'student-avatar',
    'campaign-cover',
    'campaign-logo',
    'campaign-gallery',
    'campaign-plan',
    'campaign-budget',
    'campaign-report',
    'fundraising-qr',
    'contribution-proof',
    'certificate-template',
    'certificate-issued',
    'other',
] as const

export type MediaUseCase = (typeof mediaUseCases)[number]

export const mediaDeleteResourceTypes = ['image', 'raw', 'video'] as const

export type MediaDeleteResourceType =
    (typeof mediaDeleteResourceTypes)[number]

type MediaUploadPolicy = {
    folderSegments: string[]
    allowedMimeTypes: readonly string[]
    maxFileSizeInBytes: number
}

const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/avif',
] as const

const PDF_MIME_TYPES = ['application/pdf'] as const

const DOCUMENT_MIME_TYPES = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

const SPREADSHEET_MIME_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
] as const

const IMAGE_AND_PDF_MIME_TYPES = [
    ...IMAGE_MIME_TYPES,
    ...PDF_MIME_TYPES,
] as const

const DOCUMENT_PACKAGE_MIME_TYPES = [
    ...PDF_MIME_TYPES,
    ...DOCUMENT_MIME_TYPES,
] as const

const REPORT_MIME_TYPES = [
    ...IMAGE_AND_PDF_MIME_TYPES,
    ...DOCUMENT_MIME_TYPES,
] as const

const BUDGET_MIME_TYPES = [
    ...PDF_MIME_TYPES,
    ...SPREADSHEET_MIME_TYPES,
] as const

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024

export const mediaUploadPolicies: Record<MediaUseCase, MediaUploadPolicy> = {
    'student-avatar': {
        folderSegments: ['students', 'avatars'],
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxFileSizeInBytes: 5 * 1024 * 1024,
    },
    'campaign-cover': {
        folderSegments: ['campaigns', 'covers'],
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxFileSizeInBytes: 8 * 1024 * 1024,
    },
    'campaign-logo': {
        folderSegments: ['campaigns', 'logos'],
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxFileSizeInBytes: 5 * 1024 * 1024,
    },
    'campaign-gallery': {
        folderSegments: ['campaigns', 'gallery'],
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxFileSizeInBytes: 10 * 1024 * 1024,
    },
    'campaign-plan': {
        folderSegments: ['campaigns', 'plans'],
        allowedMimeTypes: DOCUMENT_PACKAGE_MIME_TYPES,
        maxFileSizeInBytes: 15 * 1024 * 1024,
    },
    'campaign-budget': {
        folderSegments: ['campaigns', 'budgets'],
        allowedMimeTypes: BUDGET_MIME_TYPES,
        maxFileSizeInBytes: 15 * 1024 * 1024,
    },
    'campaign-report': {
        folderSegments: ['campaigns', 'reports'],
        allowedMimeTypes: REPORT_MIME_TYPES,
        maxFileSizeInBytes: 15 * 1024 * 1024,
    },
    'fundraising-qr': {
        folderSegments: ['campaigns', 'fundraising', 'qr-codes'],
        allowedMimeTypes: IMAGE_MIME_TYPES,
        maxFileSizeInBytes: 5 * 1024 * 1024,
    },
    'contribution-proof': {
        folderSegments: ['contributions', 'proofs'],
        allowedMimeTypes: IMAGE_AND_PDF_MIME_TYPES,
        maxFileSizeInBytes: DEFAULT_MAX_FILE_SIZE,
    },
    'certificate-template': {
        folderSegments: ['certificates', 'templates'],
        allowedMimeTypes: IMAGE_AND_PDF_MIME_TYPES,
        maxFileSizeInBytes: DEFAULT_MAX_FILE_SIZE,
    },
    'certificate-issued': {
        folderSegments: ['certificates', 'issued'],
        allowedMimeTypes: IMAGE_AND_PDF_MIME_TYPES,
        maxFileSizeInBytes: DEFAULT_MAX_FILE_SIZE,
    },
    other: {
        folderSegments: ['misc'],
        allowedMimeTypes: [
            ...IMAGE_AND_PDF_MIME_TYPES,
            ...DOCUMENT_MIME_TYPES,
            ...SPREADSHEET_MIME_TYPES,
        ],
        maxFileSizeInBytes: DEFAULT_MAX_FILE_SIZE,
    },
}

export const MEDIA_DELIVERY_MAX_FILE_SIZE_BYTES = Math.max(
    ...Object.values(mediaUploadPolicies).map(
        (policy) => policy.maxFileSizeInBytes
    )
)
