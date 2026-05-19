import { Response } from 'express'
import { EmptyBody, EmptyParams, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as publicService from './public.service'
import {
    PublicCampaignListQuery,
    PublicCampaignSlugParams,
    PublicCertificateVerifyParams,
} from './types'

export const listCampaigns = catchAsync(
    async (
        req: TypedRequest<EmptyBody, PublicCampaignListQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await publicService.listCampaigns(req.query)
        return ApiResponse.success(res, result)
    }
)

export const getCampaignBySlug = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, PublicCampaignSlugParams>,
        res: Response
    ) => {
        const result = await publicService.getCampaignBySlug(req.params.slug!)
        return ApiResponse.success(res, result)
    }
)

export const verifyCertificate = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, PublicCertificateVerifyParams>,
        res: Response
    ) => {
        const result = await publicService.verifyCertificate(
            req.params.certificateNo!
        )
        return ApiResponse.success(res, result)
    }
)
