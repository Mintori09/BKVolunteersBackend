import { type Request, type Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { TypedRequest } from 'src/types/request'
import * as mediaService from './media.service'
import {
    MediaDeletePayload,
    MediaReplacePayload,
    MediaRouteParams,
    MediaUploadPayload,
} from './media.types'

export const handleUploadMedia = catchAsync(
    async (req: TypedRequest<MediaUploadPayload>, res: Response) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'File is required')
        }

        const media = await mediaService.uploadMedia(
            req.file,
            req.body as MediaUploadPayload
        )

        return ApiResponse.success(
            res,
            media,
            'Media uploaded successfully',
            HttpStatus.CREATED
        )
    }
)

export const handleDeleteMedia = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params as unknown as MediaRouteParams

        const result = await mediaService.deleteMedia(
            id,
            req.body as MediaDeletePayload
        )

        return ApiResponse.success(res, result, 'Media deleted successfully')
    }
)

export const handleReplaceMedia = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'File is required')
        }

        const { id } = req.params as unknown as MediaRouteParams

        const result = await mediaService.replaceMedia(
            id,
            req.file,
            req.body as MediaReplacePayload
        )

        return ApiResponse.success(res, result, 'Media updated successfully')
    }
)
