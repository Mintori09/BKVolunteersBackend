import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as certificatesService from './certificates.service'
import {
    CertificateCampaignParams,
    CertificateIdParams,
    CreateCertificateTemplateBody,
    GenerateCertificatesBody,
    RevokeCertificateBody,
} from './types'
import { HttpStatus } from 'src/common/constants'

export const listTemplates = catchAsync(async (_req, res: Response) => {
    const result = await certificatesService.listTemplates()
    return ApiResponse.success(res, result)
})

export const createTemplate = catchAsync(
    async (
        req: TypedRequest<CreateCertificateTemplateBody, EmptyQuery>,
        res: Response
    ) => {
        const result = await certificatesService.createTemplate(
            req.body as CreateCertificateTemplateBody,
            req.payload
        )
        return ApiResponse.success(
            res,
            result,
            'Tạo certificate template thành công',
            HttpStatus.CREATED
        )
    }
)

export const generateCertificates = catchAsync(
    async (
        req: TypedRequest<
            GenerateCertificatesBody,
            EmptyQuery,
            CertificateCampaignParams
        >,
        res: Response
    ) => {
        const result = await certificatesService.generateCertificates(
            req.params.campaignId!,
            req.body as GenerateCertificatesBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const renderCertificate = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CertificateIdParams>,
        res: Response
    ) => {
        const result = await certificatesService.renderCertificate(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const downloadCertificate = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CertificateIdParams>,
        res: Response
    ) => {
        const result = await certificatesService.downloadCertificate(
            req.params.id!
        )
        return ApiResponse.success(res, result)
    }
)

export const revokeCertificate = catchAsync(
    async (
        req: TypedRequest<
            RevokeCertificateBody,
            EmptyQuery,
            CertificateIdParams
        >,
        res: Response
    ) => {
        const result = await certificatesService.revokeCertificate(
            req.params.id!,
            req.body as RevokeCertificateBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const updateTemplate = catchAsync(
    async (
        req: TypedRequest<
            CreateCertificateTemplateBody,
            EmptyQuery,
            CertificateIdParams
        >,
        res: Response
    ) => {
        const result = await certificatesService.updateTemplate(
            req.params.id!,
            req.body as CreateCertificateTemplateBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Cập nhật template thành công')
    }
)

export const deleteTemplate = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CertificateIdParams>,
        res: Response
    ) => {
        await certificatesService.deleteTemplate(req.params.id!, req.payload)
        res.sendStatus(HttpStatus.NO_CONTENT)
    }
)

export const listCampaignCertificates = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CertificateCampaignParams>,
        res: Response
    ) => {
        const result = await certificatesService.listCampaignCertificates(
            req.params.campaignId!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const reissueCertificate = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, CertificateIdParams>,
        res: Response
    ) => {
        const result = await certificatesService.reissueCertificate(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)
