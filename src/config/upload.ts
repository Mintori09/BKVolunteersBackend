import path from 'path'

const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || '/uploads'
const UPLOAD_IMAGE_PATH = process.env.UPLOAD_IMAGE_PATH || '/uploads/images'
const UPLOAD_DOCUMENT_PATH =
    process.env.UPLOAD_DOCUMENT_PATH || '/uploads/documents'
const STATIC_URL_PREFIX = process.env.STATIC_URL_PREFIX || '/files'

export const uploadConfig = {
    image: {
        maxSize: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
        storagePath: UPLOAD_IMAGE_PATH,
        urlPrefix: `${STATIC_URL_PREFIX}/images`,
    },
    document: {
        maxSize: 10 * 1024 * 1024,
        allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
        storagePath: UPLOAD_DOCUMENT_PATH,
        urlPrefix: `${STATIC_URL_PREFIX}/documents`,
    },
    basePath: UPLOAD_BASE_PATH,
    staticUrlPrefix: STATIC_URL_PREFIX,
} as const

export const getAbsoluteStoragePath = (relativePath: string): string => {
    return path.resolve(process.cwd(), relativePath)
}
