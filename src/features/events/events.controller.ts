import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as eventsService from './events.service'

export const getEventModule = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const data = await eventsService.getEventModule(moduleId)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay hang muc su kien'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay chi tiet hang muc su kien thanh cong'
        )
    }
)

export const updateEventConfig = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.updateEventConfig(
            moduleId,
            {
                location:
                    typeof req.body?.location === 'string'
                        ? req.body.location.trim()
                        : undefined,
                quota:
                    typeof req.body?.quota === 'number'
                        ? req.body.quota
                        : typeof req.body?.quota === 'string'
                          ? Number(req.body.quota)
                          : undefined,
                registration_required:
                    typeof req.body?.registration_required === 'boolean'
                        ? req.body.registration_required
                        : undefined,
                checkin_required:
                    typeof req.body?.checkin_required === 'boolean'
                        ? req.body.checkin_required
                        : undefined,
                benefits: Array.isArray(req.body?.benefits)
                    ? req.body.benefits
                          .map((item: unknown) => String(item).trim())
                          .filter(Boolean)
                    : undefined,
            },
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay hang muc su kien'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Cap nhat cau hinh su kien thanh cong'
        )
    }
)

export const createEventRegistration = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const userId = String(req.payload?.userId ?? '')

        const data = await eventsService.createEventRegistration({
            moduleId,
            userId,
            role:
                typeof req.payload?.role === 'string'
                    ? req.payload.role
                    : undefined,
            answers:
                req.body?.answers && typeof req.body.answers === 'object'
                    ? { ...req.body.answers }
                    : undefined,
        })

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay hang muc su kien'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Dang ky tham gia su kien thanh cong',
            HttpStatus.CREATED
        )
    }
)

export const listEventRegistrations = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.listEventRegistrations({
            moduleId,
            status:
                typeof req.query.status === 'string'
                    ? req.query.status
                    : undefined,
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            actor: {
                userId: actorUserId,
                role: actorRole,
            },
        })

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach dang ky su kien thanh cong'
        )
    }
)

export const approveEventRegistration = catchAsync(
    async (req: Request, res: Response) => {
        const registrationId = String(req.params.registrationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.approveEventRegistration(
            registrationId,
            typeof req.body?.review_note === 'string'
                ? req.body.review_note
                : undefined,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so dang ky'
            )
        }

        return ApiResponse.success(res, data, 'Duyet ho so thanh cong')
    }
)

export const rejectEventRegistration = catchAsync(
    async (req: Request, res: Response) => {
        const registrationId = String(req.params.registrationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.rejectEventRegistration(
            registrationId,
            typeof req.body?.reason === 'string' ? req.body.reason : undefined,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so dang ky'
            )
        }

        return ApiResponse.success(res, data, 'Tu choi ho so thanh cong')
    }
)

export const checkInEventRegistration = catchAsync(
    async (req: Request, res: Response) => {
        const registrationId = String(req.params.registrationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.checkInEventRegistration(
            registrationId,
            typeof req.body?.checked_in_at === 'string'
                ? req.body.checked_in_at
                : undefined,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so dang ky'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Diem danh tinh nguyen vien thanh cong'
        )
    }
)

export const completeEventRegistration = catchAsync(
    async (req: Request, res: Response) => {
        const registrationId = String(req.params.registrationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await eventsService.completeEventRegistration(
            registrationId,
            {
                checked_out_at:
                    typeof req.body?.checked_out_at === 'string'
                        ? req.body.checked_out_at
                        : undefined,
                hours:
                    typeof req.body?.hours === 'number'
                        ? req.body.hours
                        : typeof req.body?.hours === 'string'
                          ? Number(req.body.hours)
                          : undefined,
                note:
                    typeof req.body?.note === 'string'
                        ? req.body.note
                        : undefined,
                actor: {
                    userId: actorUserId,
                    role: actorRole,
                },
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so dang ky'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Ghi nhan hoan thanh tinh nguyen vien thanh cong'
        )
    }
)
