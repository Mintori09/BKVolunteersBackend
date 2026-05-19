import { Response } from 'express'
import { EmptyBody, EmptyParams, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as adminService from './admin.service'
import { AdminAuditLogsQuery, AdminBackgroundJobsQuery } from './types'

export const listAuditLogs = catchAsync(
    async (
        req: TypedRequest<EmptyBody, AdminAuditLogsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await adminService.listAuditLogs(req.query)
        return ApiResponse.success(res, result)
    }
)

export const listBackgroundJobs = catchAsync(
    async (
        req: TypedRequest<EmptyBody, AdminBackgroundJobsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await adminService.listBackgroundJobs(req.query)
        return ApiResponse.success(res, result)
    }
)
