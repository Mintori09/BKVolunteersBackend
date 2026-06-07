import { createHash } from 'crypto'
import path from 'path'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    config,
    isSupabaseStorageEnabled,
    prismaClient,
    supabaseAdmin,
    uploadConfig,
} from 'src/config'
import type { UserRole } from 'src/features/auth/types'

type UploadKind = 'image' | 'document'

type UploadFileInput = {
    file: Express.Multer.File
    folder?: string
    kind: UploadKind
    userId: string
    role: UserRole
}

type RequestFileAccessInput = {
    fileId: string
    userId: string
    role: UserRole
}

type UploadTargetConfig = (typeof uploadConfig)[UploadKind]

type UploaderRefs = {
    uploadedByManagerId: string | null
    uploadedByStudentId: string | null
}

type FileVisibility = 'PUBLIC' | 'PRIVATE'

const extensionByMimeType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        '.xlsx',
}

const assertSupabaseStorageEnabled = () => {
    if (isSupabaseStorageEnabled && supabaseAdmin) {
        return
    }

    throw new ApiError(
        HttpStatus.SERVICE_UNAVAILABLE,
        'Supabase Storage chua duoc cau hinh tren backend'
    )
}

const sanitizePathSegment = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')

const createStorageKey = (
    userId: string,
    kind: UploadKind,
    originalName: string,
    mimeType: string,
    folder?: string
) => {
    const now = new Date()
    const extension =
        path.extname(originalName).toLowerCase() ||
        extensionByMimeType[mimeType] ||
        ''
    const baseName = path
        .basename(originalName, extension)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    const safeBaseName = sanitizePathSegment(baseName) || 'file'
    const safeFolderSegments = (folder ?? '')
        .split('/')
        .map((segment) => sanitizePathSegment(segment))
        .filter(Boolean)

    return path.posix.join(
        ...safeFolderSegments,
        kind,
        `${now.getUTCFullYear()}`,
        `${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
        userId,
        `${Date.now()}-${safeBaseName}${extension}`
    )
}

const getUploadTarget = (kind: UploadKind): UploadTargetConfig => {
    return kind === 'image' ? uploadConfig.image : uploadConfig.document
}

const validateUploadFile = (
    file: Express.Multer.File,
    target: UploadTargetConfig
) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const allowedMimeTypes = target.allowedMimeTypes as readonly string[]
    const allowedExtensions = target.allowedExtensions as readonly string[]

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Mime type khong hop le')
    }

    if (!allowedExtensions.includes(extension)) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Phan mo rong file khong hop le'
        )
    }

    if (file.size > target.maxSize) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            `Kich thuoc file vuot qua gioi han ${Math.floor(target.maxSize / (1024 * 1024))}MB`
        )
    }
}

const resolveUploaderRefs = async (
    userId: string,
    role: UserRole
): Promise<UploaderRefs> => {
    if (role === 'SINHVIEN') {
        const student = await prismaClient.student.findUnique({
            where: { userId },
            select: { id: true },
        })

        if (!student) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so sinh vien'
            )
        }

        return {
            uploadedByManagerId: null,
            uploadedByStudentId: student.id,
        }
    }

    const manager = await prismaClient.managerAccount.findUnique({
        where: { userId },
        select: { id: true },
    })

    if (!manager) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Khong tim thay tai khoan quan ly'
        )
    }

    return {
        uploadedByManagerId: manager.id,
        uploadedByStudentId: null,
    }
}

const createAccessUrl = async (
    bucketName: string,
    storageKey: string,
    visibility: FileVisibility
) => {
    assertSupabaseStorageEnabled()

    if (visibility === 'PUBLIC') {
        const { data } = supabaseAdmin!.storage
            .from(bucketName)
            .getPublicUrl(storageKey)

        return {
            url: data.publicUrl,
            expiresIn: null,
            expiresAt: null,
        }
    }

    const expiresIn = config.supabase.storage.signedUrlTtl
    const { data, error } = await supabaseAdmin!.storage
        .from(bucketName)
        .createSignedUrl(storageKey, expiresIn)

    if (error || !data?.signedUrl) {
        throw new ApiError(
            HttpStatus.BAD_GATEWAY,
            error?.message || 'Khong the tao signed URL cho file'
        )
    }

    return {
        url: data.signedUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }
}

const canAccessPrivateFile = (
    fileRecord: {
        uploadedByManagerId: string | null
        uploadedByStudentId: string | null
    },
    uploaderRefs: UploaderRefs
) =>
    Boolean(
        (fileRecord.uploadedByManagerId &&
            fileRecord.uploadedByManagerId ===
                uploaderRefs.uploadedByManagerId) ||
        (fileRecord.uploadedByStudentId &&
            fileRecord.uploadedByStudentId === uploaderRefs.uploadedByStudentId)
    )

const normalizeVisibility = (value: string): FileVisibility => {
    if (value === 'PUBLIC' || value === 'PRIVATE') {
        return value
    }

    throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Gia tri visibility khong hop le'
    )
}

const requireBucketName = (
    value: string | undefined,
    kind: UploadKind
): string => {
    if (value) {
        return value
    }

    throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Chua cau hinh bucket cho upload kind=${kind}`
    )
}

export const uploadFile = async (input: UploadFileInput) => {
    assertSupabaseStorageEnabled()

    const target = getUploadTarget(input.kind)
    validateUploadFile(input.file, target)
    const bucketName = requireBucketName(target.bucketName, input.kind)

    const storageKey = createStorageKey(
        input.userId,
        input.kind,
        input.file.originalname,
        input.file.mimetype,
        input.folder
    )
    const checksumSha256 = createHash('sha256')
        .update(input.file.buffer)
        .digest('hex')
    const extension =
        path.extname(input.file.originalname).toLowerCase() || null
    const uploaderRefs = await resolveUploaderRefs(input.userId, input.role)

    const { error } = await supabaseAdmin!.storage
        .from(bucketName)
        .upload(storageKey, input.file.buffer, {
            contentType: input.file.mimetype,
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        throw new ApiError(
            HttpStatus.BAD_GATEWAY,
            `Upload len Supabase Storage that bai: ${error.message}`
        )
    }

    const access = await createAccessUrl(
        bucketName,
        storageKey,
        target.visibility
    )

    const fileRecord = await prismaClient.file.create({
        data: {
            bucketName,
            storageKey,
            visibility: target.visibility,
            originalName: input.file.originalname,
            mimeType: input.file.mimetype,
            fileSize: BigInt(input.file.size),
            extension,
            checksumSha256,
            publicUrl: target.visibility === 'PUBLIC' ? access.url : null,
            uploadedByManagerId: uploaderRefs.uploadedByManagerId,
            uploadedByStudentId: uploaderRefs.uploadedByStudentId,
        },
    })

    return {
        id: fileRecord.id,
        bucketName: fileRecord.bucketName,
        storageKey: fileRecord.storageKey,
        visibility: target.visibility,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        fileSize: input.file.size,
        extension,
        checksumSha256: fileRecord.checksumSha256,
        publicUrl: fileRecord.publicUrl,
        accessUrl: access.url,
        accessUrlExpiresIn: access.expiresIn,
        accessUrlExpiresAt: access.expiresAt,
        createdAt: fileRecord.createdAt,
    }
}

export const getFileAccessUrl = async (input: RequestFileAccessInput) => {
    const fileRecord = await prismaClient.file.findUnique({
        where: { id: input.fileId },
        select: {
            id: true,
            bucketName: true,
            storageKey: true,
            visibility: true,
            publicUrl: true,
            originalName: true,
            uploadedByManagerId: true,
            uploadedByStudentId: true,
            createdAt: true,
        },
    })

    if (!fileRecord) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay file')
    }

    if (!fileRecord.bucketName) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'File khong co bucketName hop le trong database'
        )
    }

    const visibility = normalizeVisibility(String(fileRecord.visibility))

    const uploaderRefs = await resolveUploaderRefs(input.userId, input.role)

    if (
        visibility === 'PRIVATE' &&
        !canAccessPrivateFile(fileRecord, uploaderRefs)
    ) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Ban khong co quyen truy cap file rieng tu nay'
        )
    }

    const access = await createAccessUrl(
        fileRecord.bucketName,
        fileRecord.storageKey,
        visibility
    )

    return {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        visibility,
        publicUrl: fileRecord.publicUrl,
        accessUrl: access.url,
        accessUrlExpiresIn: access.expiresIn,
        accessUrlExpiresAt: access.expiresAt,
        createdAt: fileRecord.createdAt,
    }
}
