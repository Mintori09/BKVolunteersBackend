import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as fundraisingService from './fundraising.service'

export const getFundraisingModule = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const data = await fundraisingService.getFundraisingModule(moduleId)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay hang muc gay quy'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay chi tiet hang muc gay quy thanh cong'
        )
    }
)

export const updateFundraisingConfig = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role
        const parseNumber = (value: unknown) =>
            typeof value === 'number'
                ? value
                : typeof value === 'string'
                  ? Number(value)
                  : undefined

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.updateFundraisingConfig(
            moduleId,
            {
                target_amount: parseNumber(req.body?.target_amount),
                receiver_name:
                    typeof req.body?.receiver_name === 'string'
                        ? req.body.receiver_name.trim()
                        : undefined,
                bank_name:
                    typeof req.body?.bank_name === 'string'
                        ? req.body.bank_name.trim()
                        : undefined,
                bank_account_no:
                    typeof req.body?.bank_account_no === 'string'
                        ? req.body.bank_account_no.trim()
                        : undefined,
                currency:
                    typeof req.body?.currency === 'string'
                        ? req.body.currency.trim()
                        : undefined,
                sepay_enabled:
                    typeof req.body?.sepay_enabled === 'boolean'
                        ? req.body.sepay_enabled
                        : undefined,
                sepay_account_id:
                    typeof req.body?.sepay_account_id === 'string'
                        ? req.body.sepay_account_id.trim()
                        : req.body?.sepay_account_id === null
                          ? null
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
                'Khong tim thay hang muc gay quy'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Cap nhat cau hinh gay quy thanh cong'
        )
    }
)

export const createMoneyDonation = catchAsync(
    async (req: Request, res: Response) => {
        const moduleId = String(req.params.moduleId ?? '')
        const amount =
            typeof req.body?.amount === 'number'
                ? req.body.amount
                : Number(req.body?.amount ?? 0)
        const data = await fundraisingService.createMoneyDonation({
            moduleId,
            userId: String(req.payload?.userId ?? ''),
            role:
                typeof req.payload?.role === 'string'
                    ? req.payload.role
                    : undefined,
            amount,
            donor_name:
                typeof req.body?.donor_name === 'string'
                    ? req.body.donor_name
                    : undefined,
            message:
                typeof req.body?.message === 'string'
                    ? req.body.message
                    : undefined,
        })

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay hang muc gay quy'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Tao giao dich dong gop thanh cong',
            HttpStatus.CREATED
        )
    }
)

export const getDonationById = catchAsync(
    async (req: Request, res: Response) => {
        const donationId = String(req.params.donationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.getDonationById(donationId, {
            userId: actorUserId,
            role: actorRole,
        })

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay giao dich dong gop'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay chi tiet dong gop thanh cong'
        )
    }
)

export const listFundraisingDonations = catchAsync(
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

        const data = await fundraisingService.listFundraisingDonations({
            moduleId,
            status:
                typeof req.query.status === 'string'
                    ? req.query.status
                    : undefined,
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            from:
                typeof req.query.from === 'string' ? req.query.from : undefined,
            to: typeof req.query.to === 'string' ? req.query.to : undefined,
            page:
                typeof req.query.page === 'string'
                    ? Number(req.query.page)
                    : undefined,
            limit:
                typeof req.query.limit === 'string'
                    ? Number(req.query.limit)
                    : undefined,
            actor: {
                userId: actorUserId,
                role: actorRole,
            },
        })

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach dong gop thanh cong'
        )
    }
)

export const verifyFundraisingDonation = catchAsync(
    async (req: Request, res: Response) => {
        const donationId = String(req.params.donationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.verifyFundraisingDonation(
            donationId,
            {
                transaction_id:
                    typeof req.body?.transaction_id === 'string'
                        ? req.body.transaction_id
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
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay dong gop')
        }

        return ApiResponse.success(res, data, 'Xac minh dong gop thanh cong')
    }
)

export const listFundraisingTransactions = catchAsync(
    async (req: Request, res: Response) => {
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.listFundraisingTransactions({
            match_status:
                req.query.match_status === 'MATCHED' ||
                req.query.match_status === 'UNMATCHED'
                    ? req.query.match_status
                    : undefined,
            module_id:
                typeof req.query.module_id === 'string'
                    ? req.query.module_id
                    : undefined,
            campaign_id:
                typeof req.query.campaign_id === 'string'
                    ? req.query.campaign_id
                    : undefined,
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            from:
                typeof req.query.from === 'string' ? req.query.from : undefined,
            to: typeof req.query.to === 'string' ? req.query.to : undefined,
            page:
                typeof req.query.page === 'string'
                    ? Number(req.query.page)
                    : undefined,
            limit:
                typeof req.query.limit === 'string'
                    ? Number(req.query.limit)
                    : undefined,
            actor: {
                userId: actorUserId,
                role: actorRole,
            },
        })

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach giao dich doi soat thanh cong'
        )
    }
)

export const attachFundraisingTransaction = catchAsync(
    async (req: Request, res: Response) => {
        const transactionId = String(req.params.transactionId ?? '')
        const donationId = String(req.body?.donation_id ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.attachFundraisingTransaction(
            transactionId,
            donationId,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay giao dich hoac dong gop'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Da doi soat giao dich voi dong gop'
        )
    }
)

export const unmatchFundraisingTransaction = catchAsync(
    async (req: Request, res: Response) => {
        const transactionId = String(req.params.transactionId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.unmatchFundraisingTransaction(
            transactionId,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay giao dich')
        }

        return ApiResponse.success(res, data, 'Da huy doi soat giao dich')
    }
)

export const rejectFundraisingDonation = catchAsync(
    async (req: Request, res: Response) => {
        const donationId = String(req.params.donationId ?? '')
        const actorUserId = String(req.payload?.userId ?? '')
        const actorRole = req.payload?.role

        if (!actorUserId || !actorRole) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chua xac thuc nguoi dung'
            )
        }

        const data = await fundraisingService.rejectFundraisingDonation(
            donationId,
            typeof req.body?.reason === 'string' ? req.body.reason : undefined,
            {
                userId: actorUserId,
                role: actorRole,
            }
        )

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay dong gop')
        }

        return ApiResponse.success(
            res,
            data,
            'Da yeu cau kiem tra lai dong gop'
        )
    }
)
