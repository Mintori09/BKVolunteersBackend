import { CampaignFileType, CampaignPublicationStatus, Prisma } from '@prisma/client'
import { HttpStatus } from 'src/common/constants'
import { prismaClient } from 'src/config'
import * as cloudinaryMediaService from 'src/services/media'
import {
    type MediaAsset,
    type MediaDeleteResourceType,
    type MediaUseCase,
} from 'src/services/media'
import { ApiError } from 'src/utils/ApiError'
import * as mediaRepository from './media.repository'
import {
    MediaDeletePayload,
    MediaReplacePayload,
    MediaUploadPayload,
} from './media.types'

const singularReferenceUseCases = new Set<MediaUseCase>([
    'student-avatar',
    'campaign-cover',
    'campaign-logo',
    'fundraising-qr',
    'contribution-proof',
    'certificate-template',
])

const campaignFileUseCaseToType: Partial<Record<MediaUseCase, CampaignFileType>> =
    {
        'campaign-plan': CampaignFileType.PLAN,
        'campaign-budget': CampaignFileType.BUDGET,
        'campaign-report': CampaignFileType.REPORT,
        'campaign-gallery': CampaignFileType.GALLERY,
    }

type SingularUploadContext = {
    kind: 'singular'
    referenceId: string
    existingFile: mediaRepository.FileRecord | null
    attachFile: (
        fileId: string,
        db: mediaRepository.DbClient
    ) => Promise<unknown>
}

type CampaignFileUploadContext = {
    kind: 'campaign-file'
    referenceId: string
    createRelation: (
        fileId: string,
        db: mediaRepository.DbClient
    ) => Promise<unknown>
}

type StandaloneUploadContext = {
    kind: 'standalone'
    referenceId?: string
}

type UploadContext =
    | SingularUploadContext
    | CampaignFileUploadContext
    | StandaloneUploadContext

const parseBoolean = (
    value: boolean | string | undefined,
    defaultValue = false
) => {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true'
    }

    return defaultValue
}

const resolveDeleteResourceType = (
    mimeType: string
): MediaDeleteResourceType => {
    if (mimeType.startsWith('video/')) {
        return 'video'
    }

    if (mimeType.startsWith('image/')) {
        return 'image'
    }

    return 'raw'
}

const normalizePrismaError = (
    error: unknown,
    fallbackMessage: string
): Error => {
    if (error instanceof ApiError) {
        return error
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
            return new ApiError(HttpStatus.NOT_FOUND, 'Media record not found')
        }

        if (error.code === 'P2003') {
            return new ApiError(
                HttpStatus.CONFLICT,
                'Media is still linked to a business record and cannot be changed'
            )
        }

        if (error.code === 'P2002') {
            return new ApiError(
                HttpStatus.CONFLICT,
                'Media record violates a unique constraint'
            )
        }
    }

    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, fallbackMessage)
}

const ensureSingleUploader = (payload: MediaUploadPayload | MediaReplacePayload) => {
    if (payload.uploadedByStudentId && payload.uploadedByManagerId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Only one uploader is allowed: student or manager'
        )
    }
}

const ensureUploaderExists = async (
    payload: MediaUploadPayload | MediaReplacePayload
) => {
    ensureSingleUploader(payload)

    if (payload.uploadedByStudentId) {
        const student = await mediaRepository.getStudentById(
            payload.uploadedByStudentId
        )

        if (!student) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Uploader student not found')
        }
    }

    if (payload.uploadedByManagerId) {
        const manager = await mediaRepository.getManagerById(
            payload.uploadedByManagerId
        )

        if (!manager) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Uploader manager not found')
        }
    }
}

const resolveUploaderFields = (
    payload: MediaUploadPayload | MediaReplacePayload,
    existingFile?: mediaRepository.FileRecord | null
) => {
    if (payload.uploadedByStudentId) {
        return {
            uploadedByStudentId: payload.uploadedByStudentId,
            uploadedByManagerId: null,
        }
    }

    if (payload.uploadedByManagerId) {
        return {
            uploadedByStudentId: null,
            uploadedByManagerId: payload.uploadedByManagerId,
        }
    }

    return {
        uploadedByStudentId: existingFile?.uploadedByStudentId ?? null,
        uploadedByManagerId: existingFile?.uploadedByManagerId ?? null,
    }
}

const resolveUploadReferenceId = (
    payload: MediaUploadPayload | MediaReplacePayload
) => {
    return (
        payload.referenceId?.trim() ||
        payload.phaseId?.trim() ||
        payload.campaignId?.trim() ||
        undefined
    )
}

const mapFileResponse = (file: mediaRepository.FileRecord) => ({
    id: file.id,
    storageKey: file.storageKey,
    originalName: file.originalName,
    mimeType: file.mimeType,
    fileSize: Number(file.fileSize),
    uploadedByStudentId: file.uploadedByStudentId,
    uploadedByManagerId: file.uploadedByManagerId,
    createdAt: file.createdAt,
})

const mapCloudinaryResponse = (asset: MediaAsset) => ({
    publicId: asset.publicId,
    secureUrl: asset.secureUrl,
    resourceType: asset.resourceType,
    folder: asset.folder,
    format: asset.format,
    width: asset.width,
    height: asset.height,
    bytes: asset.bytes,
})

const buildCreateFileInput = (
    asset: MediaAsset,
    file: Express.Multer.File,
    payload: MediaUploadPayload
): Prisma.FileUncheckedCreateInput => ({
    storageKey: asset.publicId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: BigInt(asset.bytes),
    ...resolveUploaderFields(payload),
})

const buildUpdateFileInput = (
    asset: MediaAsset,
    file: Express.Multer.File,
    payload: MediaUploadPayload | MediaReplacePayload,
    existingFile?: mediaRepository.FileRecord | null
): Prisma.FileUncheckedUpdateInput => ({
    storageKey: asset.publicId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: BigInt(asset.bytes),
    ...resolveUploaderFields(payload, existingFile),
})

const deleteCloudinaryAssetSafely = async (
    file: Pick<mediaRepository.FileRecord, 'storageKey' | 'mimeType'>
) => {
    try {
        await cloudinaryMediaService.deleteMediaFile({
            publicId: file.storageKey,
            resourceType: resolveDeleteResourceType(file.mimeType),
            invalidate: true,
        })

        return null
    } catch (error) {
        return error instanceof Error
            ? error.message
            : 'Cloudinary cleanup failed'
    }
}

const deleteNewUploadOnFailure = async (
    asset: MediaAsset,
    fallbackMimeType: string
) => {
    try {
        await cloudinaryMediaService.deleteMediaFile({
            publicId: asset.publicId,
            resourceType:
                asset.resourceType === 'image' ||
                asset.resourceType === 'video' ||
                asset.resourceType === 'raw'
                    ? asset.resourceType
                    : resolveDeleteResourceType(fallbackMimeType),
            invalidate: true,
        })
    } catch (_error) {
        // Best effort cleanup only.
    }
}

const prepareSingularContext = async (
    payload: MediaUploadPayload
): Promise<SingularUploadContext> => {
    const referenceId = payload.referenceId?.trim()

    if (!referenceId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `referenceId is required for ${payload.useCase}`
        )
    }

    switch (payload.useCase) {
        case 'student-avatar': {
            const target =
                await mediaRepository.findStudentAvatarTarget(referenceId)

            if (!target) {
                throw new ApiError(HttpStatus.NOT_FOUND, 'Student not found')
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.avatarFile,
                attachFile: (fileId, db) =>
                    mediaRepository.attachStudentAvatar(referenceId, fileId, db),
            }
        }

        case 'campaign-cover': {
            const target =
                await mediaRepository.findCampaignCoverTarget(referenceId)

            if (!target) {
                throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.coverFile,
                attachFile: (fileId, db) =>
                    mediaRepository.attachCampaignCover(referenceId, fileId, db),
            }
        }

        case 'campaign-logo': {
            const target =
                await mediaRepository.findCampaignLogoTarget(referenceId)

            if (!target) {
                throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.logoFile,
                attachFile: (fileId, db) =>
                    mediaRepository.attachCampaignLogo(referenceId, fileId, db),
            }
        }

        case 'fundraising-qr': {
            const target =
                await mediaRepository.findFundraisingQrTarget(referenceId)

            if (!target) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    'Fundraising phase config not found'
                )
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.qrFile,
                attachFile: (fileId, db) =>
                    mediaRepository.attachFundraisingQr(referenceId, fileId, db),
            }
        }

        case 'contribution-proof': {
            const target =
                await mediaRepository.findContributionProofTarget(referenceId)

            if (!target) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    'Contribution not found'
                )
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.proofFile,
                attachFile: (fileId, db) =>
                    mediaRepository.attachContributionProof(referenceId, fileId, db),
            }
        }

        case 'certificate-template': {
            const target =
                await mediaRepository.findCertificateTemplateTarget(referenceId)

            if (!target) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    'Campaign phase not found'
                )
            }

            if (
                target.campaign.publicationStatus !==
                CampaignPublicationStatus.ENDED
            ) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    'Certificate template can only be uploaded after the campaign has ended'
                )
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.volunteerConfig?.certificateTemplateFile ?? null,
                attachFile: (fileId, db) =>
                    mediaRepository.attachCertificateTemplate(
                        referenceId,
                        fileId,
                        db
                    ),
            }
        }

        case 'certificate-issued': {
            const target =
                await mediaRepository.findCertificateIssuedTarget(referenceId)

            if (!target) {
                throw new ApiError(
                    HttpStatus.NOT_FOUND,
                    'Certificate not found'
                )
            }

            return {
                kind: 'singular',
                referenceId,
                existingFile: target.file,
                attachFile: (fileId, db) =>
                    mediaRepository.attachCertificateIssuedFile(
                        referenceId,
                        fileId,
                        db
                    ),
            }
        }

        default:
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                `Unsupported singular media use case: ${payload.useCase}`
            )
    }
}

const prepareCampaignFileContext = async (
    payload: MediaUploadPayload
): Promise<CampaignFileUploadContext> => {
    const campaignId = payload.campaignId?.trim()

    if (!campaignId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `campaignId is required for ${payload.useCase}`
        )
    }

    const campaign = await mediaRepository.getCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    const phaseId = payload.phaseId?.trim()

    if (phaseId) {
        const phase = await mediaRepository.getCampaignPhaseById(
            phaseId,
            campaignId
        )

        if (!phase) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Campaign phase not found for the provided campaign'
            )
        }
    }

    const fileType = campaignFileUseCaseToType[payload.useCase]

    if (!fileType) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `Unsupported campaign file use case: ${payload.useCase}`
        )
    }

    return {
        kind: 'campaign-file',
        referenceId: resolveUploadReferenceId(payload) ?? campaignId,
        createRelation: (fileId, db) =>
            mediaRepository.createCampaignFileLink(
                {
                    campaignId,
                    phaseId,
                    fileId,
                    fileType,
                    isPublic: parseBoolean(payload.isPublic, false),
                },
                db
            ),
    }
}

const prepareUploadContext = async (
    payload: MediaUploadPayload
): Promise<UploadContext> => {
    await ensureUploaderExists(payload)

    if (payload.useCase === 'certificate-issued') {
        const referenceId = payload.referenceId?.trim()

        if (!referenceId) {
            return {
                kind: 'standalone',
                referenceId: resolveUploadReferenceId(payload),
            }
        }

        const target = await mediaRepository.findCertificateIssuedTarget(referenceId)

        if (!target) {
            // Allow upload-first flow for generated certificates:
            // referenceId may be a registrationId, then business relation
            // is created later by campaign certificate upsert endpoint.
            return {
                kind: 'standalone',
                referenceId,
            }
        }

        return {
            kind: 'singular',
            referenceId,
            existingFile: target.file,
            attachFile: (fileId, db) =>
                mediaRepository.attachCertificateIssuedFile(
                    referenceId,
                    fileId,
                    db
                ),
        }
    }

    if (singularReferenceUseCases.has(payload.useCase)) {
        return prepareSingularContext(payload)
    }

    if (campaignFileUseCaseToType[payload.useCase]) {
        return prepareCampaignFileContext(payload)
    }

    return {
        kind: 'standalone',
        referenceId: resolveUploadReferenceId(payload),
    }
}

export const uploadMedia = async (
    file: Express.Multer.File,
    payload: MediaUploadPayload
) => {
    const context = await prepareUploadContext(payload)
    const asset = await cloudinaryMediaService.uploadMediaFile({
        file,
        useCase: payload.useCase,
        referenceId: context.referenceId,
    })

    try {
        const result = await prismaClient.$transaction(async (tx) => {
            if (context.kind === 'singular' && context.existingFile) {
                const updatedFile = await mediaRepository.updateFileRecord(
                    context.existingFile.id,
                    buildUpdateFileInput(asset, file, payload, context.existingFile),
                    tx
                )

                return {
                    operation: 'updated' as const,
                    fileRecord: updatedFile,
                    replacedFile: context.existingFile,
                }
            }

            const createdFile = await mediaRepository.createFileRecord(
                buildCreateFileInput(asset, file, payload),
                tx
            )

            if (context.kind === 'singular') {
                await context.attachFile(createdFile.id, tx)
            }

            if (context.kind === 'campaign-file') {
                await context.createRelation(createdFile.id, tx)
            }

            return {
                operation: 'created' as const,
                fileRecord: createdFile,
                replacedFile: null,
            }
        })

        const cleanupWarning = result.replacedFile
            ? await deleteCloudinaryAssetSafely(result.replacedFile)
            : null

        return {
            operation: result.operation,
            file: mapFileResponse(result.fileRecord),
            cloudinary: mapCloudinaryResponse(asset),
            ...(cleanupWarning ? { cleanupWarning } : {}),
        }
    } catch (error) {
        await deleteNewUploadOnFailure(asset, file.mimetype)
        throw normalizePrismaError(error, 'Failed to persist uploaded media')
    }
}

export const replaceMedia = async (
    fileId: string,
    file: Express.Multer.File,
    payload: MediaReplacePayload
) => {
    await ensureUploaderExists(payload)

    const existingFile = await mediaRepository.getFileById(fileId)

    if (!existingFile) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Media record not found')
    }

    const asset = await cloudinaryMediaService.uploadMediaFile({
        file,
        useCase: payload.useCase,
        referenceId: resolveUploadReferenceId(payload),
    })

    try {
        const updatedFile = await prismaClient.$transaction((tx) =>
            mediaRepository.updateFileRecord(
                fileId,
                buildUpdateFileInput(asset, file, payload, existingFile),
                tx
            )
        )

        const cleanupWarning = await deleteCloudinaryAssetSafely(existingFile)

        return {
            operation: 'updated' as const,
            file: mapFileResponse(updatedFile),
            cloudinary: mapCloudinaryResponse(asset),
            ...(cleanupWarning ? { cleanupWarning } : {}),
        }
    } catch (error) {
        await deleteNewUploadOnFailure(asset, file.mimetype)
        throw normalizePrismaError(error, 'Failed to replace media')
    }
}

export const deleteMedia = async (
    fileId: string,
    payload: MediaDeletePayload
) => {
    const existingFile = await mediaRepository.getFileById(fileId)

    if (!existingFile) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Media record not found')
    }

    try {
        await prismaClient.$transaction((tx) =>
            mediaRepository.deleteFileRecord(fileId, tx)
        )
    } catch (error) {
        throw normalizePrismaError(error, 'Failed to delete media')
    }

    const invalidate = parseBoolean(payload.invalidate, true)

    try {
        const cloudinaryResult = await cloudinaryMediaService.deleteMediaFile({
            publicId: existingFile.storageKey,
            resourceType: resolveDeleteResourceType(existingFile.mimeType),
            invalidate,
        })

        return {
            operation: 'deleted' as const,
            file: mapFileResponse(existingFile),
            cloudinary: cloudinaryResult,
        }
    } catch (error) {
        return {
            operation: 'deleted' as const,
            file: mapFileResponse(existingFile),
            cloudinary: null,
            cleanupWarning:
                error instanceof Error
                    ? error.message
                    : 'Cloudinary cleanup failed',
        }
    }
}
