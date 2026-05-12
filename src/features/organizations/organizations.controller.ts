import { Response } from 'express'
import {
    EmptyBody,
    EmptyParams,
    EmptyQuery,
    TypedRequest,
} from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as organizationsService from './organizations.service'
import { OrganizationListQuery, OrganizationSlugParams } from './types'

export const listOrganizations = catchAsync(
    async (
        req: TypedRequest<EmptyBody, OrganizationListQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await organizationsService.listOrganizations(req.query)
        return ApiResponse.success(res, result)
    }
)

export const getOrganizationBySlug = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, OrganizationSlugParams>,
        res: Response
    ) => {
        const result = await organizationsService.getOrganizationBySlug(
            req.params.slug!
        )
        return ApiResponse.success(res, result)
    }
)
