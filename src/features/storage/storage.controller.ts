import { type Request, type Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as storageService from './storage.service'

const getUploadKind = (value: unknown): 'image' | 'document' => {
    if (value === 'image' || value === 'document') {
        return value
    }

    throw new ApiError(HttpStatus.BAD_REQUEST, 'kind phai la image hoac document')
}

export const uploadStorageFile = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Chua gui file can upload')
        }

        const userId = req.payload?.userId
        const role = req.payload?.role

        if (!userId || !role) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        const data = await storageService.uploadFile({
            file: req.file,
            folder:
                typeof req.body?.folder === 'string' ? req.body.folder : undefined,
            kind: getUploadKind(req.body?.kind),
            userId: String(userId),
            role,
        })

        return ApiResponse.success(
            res,
            data,
            'Upload file len Supabase Storage thanh cong',
            HttpStatus.CREATED
        )
    }
)

export const getStorageFileAccessUrl = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId
        const role = req.payload?.role

        if (!userId || !role) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        const data = await storageService.getFileAccessUrl({
            fileId: String(req.params.id ?? ''),
            userId: String(userId),
            role,
        })

        return ApiResponse.success(res, data, 'Lay access URL thanh cong')
    }
)
