import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as eventsService from './events.service'
import {
    EventApproveBody,
    EventModuleParams,
    EventRegisterBody,
    EventRegistrationParams,
} from './types'

export const getEventModule = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, EventModuleParams>,
        res: Response
    ) => {
        const result = await eventsService.getEventModule(req.params.moduleId!)
        return ApiResponse.success(res, result)
    }
)

export const registerEvent = catchAsync(
    async (
        req: TypedRequest<EventRegisterBody, EmptyQuery, EventModuleParams>,
        res: Response
    ) => {
        const result = await eventsService.registerEvent(
            req.params.moduleId!,
            req.body,
            req.payload
        )
        return ApiResponse.success(
            res,
            result,
            'Đăng ký sự kiện thành công',
            201
        )
    }
)

export const approveEventRegistration = catchAsync(
    async (
        req: TypedRequest<EventApproveBody, EmptyQuery, EventRegistrationParams>,
        res: Response
    ) => {
        const result = await eventsService.approveEventRegistration(
            req.params.id!,
            req.body,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)
