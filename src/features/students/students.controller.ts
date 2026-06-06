import { Request, Response } from 'express'
import * as certificatesService from 'src/features/certificates/certificates.service'
import * as catalogService from 'src/features/catalog/catalog.service'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

export const getDashboard = catchAsync(async (_req: Request, res: Response) => {
    const data = catalogService.getStudentDashboard()

    return ApiResponse.success(res, data, 'Lay tong quan sinh vien thanh cong')
})

export const getActivities = catchAsync(async (req: Request, res: Response) => {
    const data = catalogService.getStudentActivities({
        type: typeof req.query.type === 'string' ? req.query.type : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
    })

    return ApiResponse.success(res, data, 'Lay lich su hoat dong sinh vien thanh cong')
})

export const getDonations = catchAsync(async (req: Request, res: Response) => {
    const data = catalogService.getStudentDonations({
        type: typeof req.query.type === 'string' ? req.query.type : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
    })

    return ApiResponse.success(res, data, 'Lay lich su dong gop sinh vien thanh cong')
})

export const getMyCertificates = catchAsync(async (_req: Request, res: Response) => {
    const data = certificatesService.listStudentCertificates()

    return ApiResponse.success(
        res,
        data,
        'Lay danh sach chung nhan cua sinh vien thanh cong'
    )
})
