import { type NextFunction, type Request, type Response } from 'express'
import multer, { MulterError } from 'multer'
import { HttpStatus } from 'src/common/constants'
import { MEDIA_DELIVERY_MAX_FILE_SIZE_BYTES } from 'src/services/media'
import { ApiError } from 'src/utils/ApiError'

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 1,
        fileSize: MEDIA_DELIVERY_MAX_FILE_SIZE_BYTES,
    },
})

const formatDeliveryLimit = (bytes: number) => {
    const megaBytes = bytes / (1024 * 1024)

    return `${Number(megaBytes.toFixed(1))}MB`
}

export const uploadSingleFile = (fieldName = 'file') => {
    const middleware = upload.single(fieldName)

    return (req: Request, res: Response, next: NextFunction) => {
        middleware(req, res, (error?: unknown) => {
            if (!error) {
                next()
                return
            }

            if (error instanceof MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    next(
                        new ApiError(
                            HttpStatus.PAYLOAD_TOO_LARGE,
                            `File exceeds delivery limit of ${formatDeliveryLimit(MEDIA_DELIVERY_MAX_FILE_SIZE_BYTES)}`
                        )
                    )
                    return
                }

                next(new ApiError(HttpStatus.BAD_REQUEST, error.message))
                return
            }

            next(error)
        })
    }
}
