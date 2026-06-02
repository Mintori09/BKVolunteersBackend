import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as titleService from './title.service'
import { CreateTitleInput, UpdateTitleInput } from './types'

const serializeTitle = (title: {
    id: bigint | number | string
    name: string
    description: string | null
    minPoints: number
    iconUrl: string | null
    badgeColor?: string | null
    isActive?: boolean | null
    createdAt: Date
    updatedAt: Date
}) => ({
    id: serializeId(title.id)!,
    name: title.name,
    description: title.description,
    minPoints: title.minPoints,
    iconUrl: title.iconUrl,
    badgeColor: title.badgeColor ?? null,
    isActive: title.isActive ?? true,
    createdAt: title.createdAt,
    updatedAt: title.updatedAt,
})

export const createTitle = catchAsync(async (req, res: Response) => {
    const data = req.body as CreateTitleInput
    const title = await titleService.createTitle(data)

    return ApiResponse.success(
        res,
        serializeTitle(title),
        'Tạo danh hiệu thành công',
        HttpStatus.CREATED
    )
})

export const updateTitle = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string
    const data = req.body as UpdateTitleInput

    const title = await titleService.updateTitle(id, data)
    return ApiResponse.success(
        res,
        serializeTitle(title),
        'Cập nhật danh hiệu thành công'
    )
})

export const deleteTitle = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    await titleService.deleteTitle(id)
    return ApiResponse.success(res, null, 'Xóa danh hiệu thành công')
})

export const getAllTitles = catchAsync(async (req, res: Response) => {
    const { page, limit, isActive } = req.query as any

    const titles = await titleService.getAllTitles({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        isActive:
            isActive === undefined
                ? undefined
                : String(isActive).toLowerCase() === 'true',
    })

    return ApiResponse.success(res, {
        items: titles.items.map(serializeTitle),
        meta: titles.meta,
    })
})

export const getTitleById = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    const title = await titleService.getTitleById(id)
    return ApiResponse.success(res, serializeTitle(title))
})
