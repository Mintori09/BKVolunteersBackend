import { Request, Response } from 'express'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as locationsService from './locations.service'
import { LocationItem } from './types'

export const listLocations = catchAsync(async (req: Request, res: Response) => {
    const type =
        typeof req.query.type === 'string' ? req.query.type : undefined

    const data = locationsService.listLocations(type)

    return ApiResponse.success<LocationItem[]>(
        res,
        data,
        'Lay danh sach dia diem thanh cong'
    )
})

