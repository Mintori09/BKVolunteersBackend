import { Response } from 'express'
import { EmptyBody, EmptyParams, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as reportsService from './reports.service'
import { CampaignReportParams, SchoolOverviewQuery } from './types'

export const getCampaignReport = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CampaignReportParams>,
        res: Response
    ) => {
        const result = await reportsService.getCampaignReport(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const getCampaignReconciliationReport = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CampaignReportParams>,
        res: Response
    ) => {
        const result = await reportsService.getCampaignReconciliationReport(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const getSchoolOverview = catchAsync(
    async (
        req: TypedRequest<EmptyBody, SchoolOverviewQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await reportsService.getSchoolOverview(
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)
