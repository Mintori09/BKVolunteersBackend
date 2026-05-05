import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as titleService from './title.service'
import { CreateTitleInput, UpdateTitleInput } from './types'

export const createTitle = catchAsync(async (req, res: Response) => {
    const data = req.body as CreateTitleInput
    const title = await titleService.createTitle(data)

    return ApiResponse.success(
        res,
        title,
        'Tạo danh hiệu thành công',
        HttpStatus.CREATED
    )
})

export const updateTitle = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)
    const data = req.body as UpdateTitleInput

    const title = await titleService.updateTitle(id, data)
    return ApiResponse.success(res, title, 'Cập nhật danh hiệu thành công')
})

export const deleteTitle = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    await titleService.deleteTitle(id)
    return ApiResponse.success(res, null, 'Xóa danh hiệu thành công')
})

export const getAllTitles = catchAsync(async (req, res: Response) => {
    const { page, limit, isActive } = req.query as any

    const titles = await titleService.getAllTitles({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        isActive:
            isActive === 'true'
                ? true
                : isActive === 'false'
                  ? false
                  : undefined,
    })

    return ApiResponse.success(res, titles)
})

export const getTitleById = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    const title = await titleService.getTitleById(id)
    return ApiResponse.success(res, title)
})
