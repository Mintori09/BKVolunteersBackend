import multer from 'multer'
import { uploadConfig } from 'src/config'

const allowedMimeTypes: readonly string[] = [
    ...uploadConfig.image.allowedMimeTypes,
    ...uploadConfig.document.allowedMimeTypes,
]

const maxFileSize = Math.max(
    uploadConfig.image.maxSize,
    uploadConfig.document.maxSize
)

export const storageUploadMiddleware = multer({
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true)
            return
        }

        cb(new Error('Loai file khong duoc ho tro'))
    },
    limits: {
        fileSize: maxFileSize,
    },
})
