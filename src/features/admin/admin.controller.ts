import { Response } from 'express'
import {
    EmptyBody,
    EmptyParams,
    EmptyQuery,
    TypedRequest,
} from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as adminService from './admin.service'
import {
    AdminAuditLogsQuery,
    AdminBackgroundJobsQuery,
    AdminRetryBackgroundJobParams,
    AdminRunBackgroundJobsBody,
} from './types'

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

export const runBackgroundJobs = catchAsync(
    async (
        req: TypedRequest<AdminRunBackgroundJobsBody, EmptyQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await adminService.runBackgroundJobs(
            req.body as AdminRunBackgroundJobsBody
        )
        return ApiResponse.success(res, result)
    }
)

export const retryBackgroundJob = catchAsync(
    async (
        req: TypedRequest<
            EmptyBody,
            EmptyQuery,
            AdminRetryBackgroundJobParams
        >,
        res: Response
    ) => {
        const result = await adminService.retryBackgroundJob(req.params.id!)
        return ApiResponse.success(res, result)
    }
)
