import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import type { ReadableStream as NodeReadableStream } from 'node:stream/web'
import { type Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { TypedRequest } from 'src/types/request'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as campaignService from './campaign.service'
import type {
    CampaignCertificateLayoutResponse,
    CampaignDraftRouteParams,
    ExportOrganizerCampaignPayload,
    CampaignLifecyclePayload,
    CreateDraftCampaignPayload,
    OrganizerCampaignCertificateTemplateRouteParams,
    OrganizerCampaignDocumentRouteParams,
    OrganizerCampaignRouteParams,
    SendCampaignCertificateEmailsPayload,
    SendCampaignCertificateEmailsResponse,
    UpsertGeneratedCampaignCertificatesPayload,
    UpsertGeneratedCampaignCertificatesResponse,
    UpdateCampaignCertificateLayoutPayload,
    UpsertOrganizerCampaignPayload,
    UpdateDraftCampaignPayload,
} from './campaign.types'

const buildContentDispositionAttachment = (filename: string) => {
    const safeAsciiName =
        filename
            .replace(/[^\x20-\x7E]/g, '_')
            .replace(/["\\]/g, '_')
            .trim() || 'download'
    const encodedName = encodeURIComponent(filename)
    return `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
}

export const getDraftBootstrap = catchAsync(async (req, res: Response) => {
    const bootstrap = await campaignService.getDraftBootstrap(req.payload)

    return ApiResponse.success(res, bootstrap)
})

export const getDraftCampaign = catchAsync(async (req, res: Response) => {
    const { id } = req.params as unknown as CampaignDraftRouteParams
    const campaign = await campaignService.getDraftCampaign(req.payload, id)

    return ApiResponse.success(res, campaign)
})

export const handleCreateDraftCampaign = catchAsync(
    async (
        req: TypedRequest<CreateDraftCampaignPayload>,
        res: Response
    ) => {
        const campaign = await campaignService.createDraftCampaign(
            req.payload,
            req.body as CreateDraftCampaignPayload
        )

        return ApiResponse.success(
            res,
            campaign,
            'Campaign draft created successfully',
            HttpStatus.CREATED
        )
    }
)

export const handleUpdateDraftCampaign = catchAsync(
    async (
        req: TypedRequest<UpdateDraftCampaignPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as CampaignDraftRouteParams
        const campaign = await campaignService.updateDraftCampaign(
            req.payload,
            id,
            req.body as UpdateDraftCampaignPayload
        )

        return ApiResponse.success(
            res,
            campaign,
            'Campaign draft updated successfully'
        )
    }
)

export const getOrganizerCampaignBootstrap = catchAsync(
    async (req, res: Response) => {
        const bootstrap = await campaignService.getOrganizerCampaignBootstrap(
            req.payload
        )

        return ApiResponse.success(res, bootstrap)
    }
)

export const listOrganizerCampaigns = catchAsync(
    async (req, res: Response) => {
        const response = await campaignService.listOrganizerCampaigns(req.payload)

        return ApiResponse.success(res, response)
    }
)

export const getOrganizerCampaignDetail = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const campaign = await campaignService.getOrganizerCampaignDetail(
            req.payload,
            id
        )

        return ApiResponse.success(res, campaign)
    }
)

export const createOrganizerCampaign = catchAsync(
    async (
        req: TypedRequest<UpsertOrganizerCampaignPayload>,
        res: Response
    ) => {
        const campaign = await campaignService.createOrganizerCampaign(
            req.payload,
            req.body as UpsertOrganizerCampaignPayload
        )

        return ApiResponse.success(
            res,
            campaign,
            'Campaign created successfully',
            HttpStatus.CREATED
        )
    }
)

export const updateOrganizerCampaign = catchAsync(
    async (
        req: TypedRequest<UpsertOrganizerCampaignPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const campaign = await campaignService.updateOrganizerCampaign(
            req.payload,
            id,
            req.body as UpsertOrganizerCampaignPayload
        )

        return ApiResponse.success(
            res,
            campaign,
            'Campaign updated successfully'
        )
    }
)

export const deleteOrganizerCampaign = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.deleteOrganizerCampaign(
            req.payload,
            id
        )

        return ApiResponse.success(res, response, 'Campaign deleted successfully')
    }
)

export const getOrganizerCampaignWorkspace = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const workspace = await campaignService.getOrganizerCampaignWorkspace(
            req.payload,
            id
        )

        return ApiResponse.success(res, workspace)
    }
)

export const downloadOrganizerCampaignDocument = catchAsync(
    async (req, res: Response) => {
        const { id, documentId } =
            req.params as unknown as OrganizerCampaignDocumentRouteParams
        const file = await campaignService.getOrganizerCampaignDocumentDownload(
            req.payload,
            id,
            documentId
        )

        let upstreamResponse = await fetch(file.url)

        if (
            (!upstreamResponse.ok || !upstreamResponse.body) &&
            file.fallbackUrl &&
            file.fallbackUrl !== file.url
        ) {
            upstreamResponse = await fetch(file.fallbackUrl)
        }

        if (!upstreamResponse.ok || !upstreamResponse.body) {
            throw new ApiError(
                HttpStatus.BAD_GATEWAY,
                `Unable to fetch document from storage provider (status ${upstreamResponse.status})`
            )
        }

        const contentLength = upstreamResponse.headers.get('content-length')

        res.status(HttpStatus.OK)
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
        res.setHeader(
            'Content-Disposition',
            buildContentDispositionAttachment(file.originalName)
        )
        res.setHeader('Cache-Control', 'private, max-age=60')
        if (contentLength) {
            res.setHeader('Content-Length', contentLength)
        }

        await pipeline(
            Readable.fromWeb(
                upstreamResponse.body as unknown as NodeReadableStream
            ),
            res
        )
    }
)

export const downloadOrganizerCampaignCertificateTemplate = catchAsync(
    async (req, res: Response) => {
        const { id, phaseId } =
            req.params as unknown as OrganizerCampaignCertificateTemplateRouteParams
        const file =
            await campaignService.getOrganizerCampaignCertificateTemplateDownload(
                req.payload,
                id,
                phaseId
            )

        if (!file) {
            return res.status(HttpStatus.NO_CONTENT).end()
        }

        let upstreamResponse = await fetch(file.url)

        if (
            (!upstreamResponse.ok || !upstreamResponse.body) &&
            file.fallbackUrl &&
            file.fallbackUrl !== file.url
        ) {
            upstreamResponse = await fetch(file.fallbackUrl)
        }

        if (!upstreamResponse.ok || !upstreamResponse.body) {
            throw new ApiError(
                HttpStatus.BAD_GATEWAY,
                `Unable to fetch certificate template from storage provider (status ${upstreamResponse.status})`
            )
        }

        const contentLength = upstreamResponse.headers.get('content-length')

        res.status(HttpStatus.OK)
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
        res.setHeader(
            'Content-Disposition',
            buildContentDispositionAttachment(file.originalName)
        )
        res.setHeader('Cache-Control', 'private, max-age=60')
        if (contentLength) {
            res.setHeader('Content-Length', contentLength)
        }

        await pipeline(
            Readable.fromWeb(
                upstreamResponse.body as unknown as NodeReadableStream
            ),
            res
        )
    }
)

export const updateCampaignCertificateLayout = catchAsync(
    async (
        req: TypedRequest<UpdateCampaignCertificateLayoutPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.updateCampaignCertificateLayout(
            req.payload,
            id,
            req.body as UpdateCampaignCertificateLayoutPayload
        )

        return ApiResponse.success(
            res,
            response as CampaignCertificateLayoutResponse,
            'Campaign certificate layout updated successfully'
        )
    }
)

export const sendCampaignCertificateEmails = catchAsync(
    async (
        req: TypedRequest<SendCampaignCertificateEmailsPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.sendCampaignCertificateEmails(
            req.payload,
            id,
            req.body as SendCampaignCertificateEmailsPayload
        )

        return ApiResponse.success(
            res,
            response as SendCampaignCertificateEmailsResponse,
            'Campaign certificate emails sent successfully'
        )
    }
)

export const upsertGeneratedCampaignCertificates = catchAsync(
    async (
        req: TypedRequest<UpsertGeneratedCampaignCertificatesPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response =
            await campaignService.upsertGeneratedCampaignCertificates(
                req.payload,
                id,
                req.body as UpsertGeneratedCampaignCertificatesPayload
            )

        return ApiResponse.success(
            res,
            response as UpsertGeneratedCampaignCertificatesResponse,
            'Generated campaign certificates saved successfully'
        )
    }
)

export const submitOrganizerCampaign = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.submitOrganizerCampaign(
            req.payload,
            id
        )

        return ApiResponse.success(res, response, 'Campaign submitted successfully')
    }
)

export const approveOrganizerCampaign = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.approveOrganizerCampaign(
            req.payload,
            id
        )

        return ApiResponse.success(res, response, 'Campaign approved successfully')
    }
)

export const publishOrganizerCampaign = catchAsync(
    async (req, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.publishOrganizerCampaign(
            req.payload,
            id
        )

        return ApiResponse.success(res, response, 'Campaign published successfully')
    }
)

export const updateCampaignLifecycle = catchAsync(
    async (
        req: TypedRequest<CampaignLifecyclePayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.updateCampaignLifecycle(
            req.payload,
            id,
            req.body as CampaignLifecyclePayload
        )

        return ApiResponse.success(
            res,
            response,
            'Campaign lifecycle updated successfully'
        )
    }
)

export const exportOrganizerCampaign = catchAsync(
    async (req: TypedRequest<ExportOrganizerCampaignPayload>, res: Response) => {
        const { id } = req.params as unknown as OrganizerCampaignRouteParams
        const response = await campaignService.exportOrganizerCampaign(
            req.payload,
            id,
            req.body as ExportOrganizerCampaignPayload
        )

        return ApiResponse.success(res, response)
    }
)
