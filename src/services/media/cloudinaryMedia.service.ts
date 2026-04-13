import { randomUUID } from 'node:crypto'
import path from 'node:path'
import {
    v2 as cloudinary,
    type UploadApiErrorResponse,
    type UploadApiResponse,
} from 'cloudinary'
import { HttpStatus } from 'src/common/constants'
import { config } from 'src/config'
import { ApiError } from 'src/utils/ApiError'
import {
    mediaDeleteResourceTypes,
    type MediaDeleteResourceType,
    mediaUploadPolicies,
    type MediaUseCase,
} from './media.constants'

export type MediaAsset = {
    publicId: string
    secureUrl: string
    resourceType: string
    folder: string
    originalName: string
    bytes: number
    format: string | null
    width: number | null
    height: number | null
}

type UploadMediaInput = {
    file: Express.Multer.File
    useCase: MediaUseCase
    referenceId?: string
}

type DeleteMediaInput = {
    publicId: string
    resourceType?: MediaDeleteResourceType
    invalidate?: boolean
}

let hasConfiguredCloudinary = false

const ensureCloudinaryConfigured = () => {
    if (!config.cloudinary.is_configured) {
        throw new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Cloudinary is not configured'
        )
    }

    if (hasConfiguredCloudinary) {
        return
    }

    cloudinary.config({
        cloud_name: config.cloudinary.cloud_name,
        api_key: config.cloudinary.api_key,
        api_secret: config.cloudinary.api_secret,
        secure: true,
    })

    hasConfiguredCloudinary = true
}

const formatFileSize = (bytes: number) => {
    const megaBytes = bytes / (1024 * 1024)

    return `${Number(megaBytes.toFixed(1))}MB`
}

const sanitizeSegment = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')

const sanitizePublicId = (filename: string) => {
    const extension = path.extname(filename)
    const rawName = path.basename(filename, extension)
    const sanitizedName = sanitizeSegment(rawName)

    return sanitizedName || 'asset'
}

const normalizeCloudinaryError = (
    error: UploadApiErrorResponse | Error | null
) => {
    if (!error) {
        return new ApiError(
            HttpStatus.BAD_GATEWAY,
            'Cloudinary upload failed'
        )
    }

    return new ApiError(
        HttpStatus.BAD_GATEWAY,
        error.message || 'Cloudinary upload failed'
    )
}

export const validateMediaFile = (
    file: Express.Multer.File,
    useCase: MediaUseCase
) => {
    const policy = mediaUploadPolicies[useCase]

    if (!file) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'File is required')
    }

    if (!policy) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Unsupported media use case')
    }

    if (!policy.allowedMimeTypes.includes(file.mimetype)) {
        throw new ApiError(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            `File type ${file.mimetype} is not allowed for ${useCase}`
        )
    }

    if (file.size > policy.maxFileSizeInBytes) {
        throw new ApiError(
            HttpStatus.PAYLOAD_TOO_LARGE,
            `File exceeds ${formatFileSize(policy.maxFileSizeInBytes)} for ${useCase}`
        )
    }
}

export const resolveMediaFolder = (
    useCase: MediaUseCase,
    referenceId?: string
) => {
    const policy = mediaUploadPolicies[useCase]
    const folderSegments = [
        config.cloudinary.base_folder,
        ...policy.folderSegments,
    ]

    const sanitizedReferenceId = referenceId
        ? sanitizeSegment(referenceId)
        : undefined

    if (sanitizedReferenceId) {
        folderSegments.push(sanitizedReferenceId)
    }

    return folderSegments.join('/')
}

const mapUploadResult = (
    result: UploadApiResponse,
    file: Express.Multer.File,
    folder: string
): MediaAsset => ({
    publicId: result.public_id,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
    folder,
    originalName: file.originalname,
    bytes: result.bytes,
    format: result.format ?? null,
    width: result.width ?? null,
    height: result.height ?? null,
})

export const uploadMediaFile = async ({
    file,
    useCase,
    referenceId,
}: UploadMediaInput): Promise<MediaAsset> => {
    ensureCloudinaryConfigured()
    validateMediaFile(file, useCase)

    const folder = resolveMediaFolder(useCase, referenceId)
    const publicId = `${sanitizePublicId(file.originalname)}-${randomUUID().slice(0, 8)}`

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: 'auto',
                overwrite: false,
                use_filename: false,
                unique_filename: false,
            },
            (
                error: UploadApiErrorResponse | undefined,
                result: UploadApiResponse | undefined
            ) => {
                if (error || !result) {
                    reject(normalizeCloudinaryError(error ?? null))
                    return
                }

                resolve(mapUploadResult(result, file, folder))
            }
        )

        uploadStream.end(file.buffer)
    })
}

export const deleteMediaFile = async ({
    publicId,
    resourceType = 'image',
    invalidate = true,
}: DeleteMediaInput) => {
    ensureCloudinaryConfigured()

    const normalizedPublicId = publicId?.trim()

    if (!normalizedPublicId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'publicId is required')
    }

    if (!mediaDeleteResourceTypes.includes(resourceType)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Unsupported resource type'
        )
    }

    const result = await cloudinary.uploader.destroy(normalizedPublicId, {
        resource_type: resourceType,
        invalidate,
    })

    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new ApiError(
            HttpStatus.BAD_GATEWAY,
            `Cloudinary delete failed with status: ${result.result}`
        )
    }

    return {
        publicId: normalizedPublicId,
        resourceType,
        deleted: result.result === 'ok',
        result: result.result,
    }
}
