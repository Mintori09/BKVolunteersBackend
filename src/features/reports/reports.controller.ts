import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as reportsService from './reports.service'
import { CampaignReportParams } from './types'

export const getCampaignReport = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CampaignReportParams>,
        res: Response
    ) => {
        const result = await reportsService.getCampaignReport(req.params.id!)
        return ApiResponse.success(res, result)
    }
)

export const getSchoolOverview = catchAsync(async (_req, res: Response) => {
    const result = await reportsService.getSchoolOverview()
    return ApiResponse.success(res, result)
})
