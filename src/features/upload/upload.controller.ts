import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as uploadService from './upload.service'
import { UploadOutput } from './types'
import fs from 'fs'
import path from 'path'

export const handleUploadImage = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'File là bắt buộc')
        }

        const result = uploadService.buildUploadResponse(req.file, 'image')
        return ApiResponse.success<UploadOutput>(res, result)
    }
)

export const handleUploadDocument = catchAsync(
    async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'File là bắt buộc')
        }

        const result = uploadService.buildUploadResponse(req.file, 'document')
        return ApiResponse.success<UploadOutput>(res, result)
    }
)

export const handleServeImage = catchAsync(
    async (req: Request, res: Response) => {
        const filename = req.params.filename as string

        if (!filename) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Tên file là bắt buộc')
        }

        const sanitizedFilename = path.basename(filename)

        if (sanitizedFilename !== filename) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Tên file không hợp lệ')
        }

        const filePath = uploadService.getFilePath(sanitizedFilename, 'image')

        if (!fs.existsSync(filePath)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy file')
        }

        return res.sendFile(filePath)
    }
)

export const handleServeDocument = catchAsync(
    async (req: Request, res: Response) => {
        const filename = req.params.filename as string

        if (!filename) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Tên file là bắt buộc')
        }

        const sanitizedFilename = path.basename(filename)

        if (sanitizedFilename !== filename) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Tên file không hợp lệ')
        }

        const filePath = uploadService.getFilePath(
            sanitizedFilename,
            'document'
        )

        if (!fs.existsSync(filePath)) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy file')
        }

        return res.sendFile(filePath)
    }
)
