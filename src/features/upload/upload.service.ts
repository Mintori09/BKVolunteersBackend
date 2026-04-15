import { UploadOutput, UploadType } from './types'
import { uploadConfig, getAbsoluteStoragePath } from 'src/config'

export const buildUploadResponse = (
    file: Express.Multer.File,
    uploadType: UploadType
): UploadOutput => {
    const config =
        uploadType === 'image' ? uploadConfig.image : uploadConfig.document

    return {
        url: `${config.urlPrefix}/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `${config.storagePath}/${file.filename}`,
    }
}

export const getFilePath = (
    filename: string,
    uploadType: UploadType
): string => {
    const config =
        uploadType === 'image' ? uploadConfig.image : uploadConfig.document
    return getAbsoluteStoragePath(`${config.storagePath}/${filename}`)
}
