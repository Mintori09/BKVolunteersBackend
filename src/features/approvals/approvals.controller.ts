import { Response } from 'express'
import { EmptyBody, EmptyParams, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as approvalsService from './approvals.service'
import { ApprovalQueueQuery } from './types'

export const getApprovalQueue = catchAsync(
    async (
        req: TypedRequest<EmptyBody, ApprovalQueueQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await approvalsService.getApprovalQueue(
            req.query,
            req.payload
                ? {
                      accountType: req.payload.accountType,
                      role: req.payload.role,
                      organizationId: req.payload.organizationId ?? undefined,
                      facultyId: req.payload.facultyId ?? undefined,
                  }
                : undefined
        )
        return ApiResponse.success(res, result)
    }
)
