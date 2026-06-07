import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as certificatesService from './certificates.service'

export const getTemplates = catchAsync(async (_req: Request, res: Response) => {
    const data = await certificatesService.listTemplates()

    return ApiResponse.success(res, data, 'Lay danh sach template thanh cong')
})

export const createTemplate = catchAsync(
    async (req: Request, res: Response) => {
        const data = await certificatesService.createTemplate({
            name: String(req.body?.name ?? '').trim(),
            type: String(req.body?.type ?? '').trim(),
            file_url: req.body?.file_url ?? null,
            layout_json: req.body?.layout_json ?? null,
            created_by: req.payload?.userId ?? null,
        })

        return ApiResponse.success(
            res,
            data,
            'Tao template chung nhan thanh cong',
            HttpStatus.CREATED
        )
    }
)

export const updateTemplate = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await certificatesService.updateTemplate(id, {
            name: req.body?.name,
            type: req.body?.type,
            file_url: req.body?.file_url,
            layout_json: req.body?.layout_json,
            status: req.body?.status,
        })

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay template chung nhan'
            )
        }

        return ApiResponse.success(res, data, 'Cap nhat template thanh cong')
    }
)

export const deactivateTemplate = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await certificatesService.deactivateTemplate(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay template chung nhan'
            )
        }

        return ApiResponse.success(
            res,
            undefined,
            'Da chuyen template sang INACTIVE'
        )
    }
)

export const listCampaignCertificates = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.campaignId ?? '')
        const data =
            await certificatesService.listCampaignCertificates(campaignId)

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach chung nhan theo chien dich thanh cong'
        )
    }
)

export const generateCampaignCertificates = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.campaignId ?? '')
        const data = await certificatesService.generateCertificates({
            campaign_id: campaignId,
            template_id: String(req.body?.template_id ?? ''),
            module_id:
                typeof req.body?.module_id === 'string' &&
                req.body.module_id.trim()
                    ? req.body.module_id.trim()
                    : undefined,
            dry_run: Boolean(req.body?.dry_run),
        })

        return ApiResponse.success(res, data, 'Xu ly tao chung nhan thanh cong')
    }
)

export const renderCertificate = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await certificatesService.renderCertificate(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay chung nhan'
            )
        }

        return ApiResponse.success(res, data, 'Da xep hang render chung nhan')
    }
)

export const getCertificateDownload = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await certificatesService.getCertificateDownload(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay chung nhan'
            )
        }

        return ApiResponse.success(res, data, 'Lay file chung nhan thanh cong')
    }
)

export const revokeCertificate = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const reason =
            typeof req.body?.revoke_reason === 'string'
                ? req.body.revoke_reason.trim()
                : typeof req.body?.reason === 'string'
                  ? req.body.reason.trim()
                  : undefined
        const data = await certificatesService.revokeCertificate(
            id,
            req.payload?.userId ?? 'system',
            reason
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay chung nhan'
            )
        }

        return ApiResponse.success(res, data, 'Thu hoi chung nhan thanh cong')
    }
)

export const reissueCertificate = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await certificatesService.reissueCertificate(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay chung nhan'
            )
        }

        return ApiResponse.success(res, data, 'Cap lai chung nhan thanh cong')
    }
)

export const getMyCertificates = catchAsync(
    async (req: Request, res: Response) => {
        const data = await certificatesService.listStudentCertificates(
            req.payload?.userId ?? ''
        )

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach chung nhan cua sinh vien thanh cong'
        )
    }
)

export const verifyCertificate = catchAsync(
    async (req: Request, res: Response) => {
        const code = String(req.params.code ?? '')
        const data = await certificatesService.verifyCertificate(code)

        return ApiResponse.success(res, data, 'Kiem tra chung nhan thanh cong')
    }
)
