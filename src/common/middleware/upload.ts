import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { uploadConfig, getAbsoluteStoragePath } from 'src/config'

export type UploadType = 'image' | 'document'

const getExtension = (mimetype: string): string => {
    const mimeToExt: Record<string, string> = {
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
    return mimeToExt[mimetype] || ''
}

const ensureDirectoryExists = (dirPath: string): void => {
    const absolutePath = getAbsoluteStoragePath(dirPath)
    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true })
    }
}

const createStorage = (uploadType: UploadType) => {
    const config =
        uploadType === 'image' ? uploadConfig.image : uploadConfig.document

    return multer.diskStorage({
        destination: (_req, _file, cb) => {
            ensureDirectoryExists(config.storagePath)
            cb(null, getAbsoluteStoragePath(config.storagePath))
        },
        filename: (_req, file, cb) => {
            const ext = getExtension(file.mimetype)
            const filename = `${uuidv4()}${ext}`
            cb(null, filename)
        },
    })
}

const createFileFilter = (uploadType: UploadType) => {
    const config =
        uploadType === 'image' ? uploadConfig.image : uploadConfig.document

    return (
        _req: Express.Request,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback
    ) => {
        const ext = path.extname(file.originalname).toLowerCase()
        const allowedMimeTypes = config.allowedMimeTypes as readonly string[]
        const allowedExtensions = config.allowedExtensions as readonly string[]

        if (
            allowedMimeTypes.includes(file.mimetype) &&
            allowedExtensions.includes(ext)
        ) {
            cb(null, true)
        } else {
            const errorMessage =
                uploadType === 'image'
                    ? 'Chỉ chấp nhận file ảnh JPG, PNG, WEBP'
                    : 'Chỉ chấp nhận file PDF, DOC, DOCX, XLS, XLSX'
            cb(new Error(errorMessage))
        }
    }
}

export const createUploadMiddleware = (uploadType: UploadType) => {
    const config =
        uploadType === 'image' ? uploadConfig.image : uploadConfig.document

    return multer({
        storage: createStorage(uploadType),
        fileFilter: createFileFilter(uploadType),
        limits: {
            fileSize: config.maxSize,
        },
    })
}

export const uploadImageMiddleware = createUploadMiddleware('image')
export const uploadDocumentMiddleware = createUploadMiddleware('document')
