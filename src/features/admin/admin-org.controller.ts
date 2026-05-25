import { Response } from 'express'
import {
    EmptyBody,
    EmptyParams,
    TypedRequest,
} from 'src/types/request'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as adminOrgService from './admin-org.service'
import {
    AdminCreateOrganizationBody,
    AdminOrganizationIdParams,
    AdminOrganizationsQuery,
    AdminUpdateOrganizationBody,
} from './types'

export const listOrganizations = catchAsync(
    async (
        req: TypedRequest<EmptyBody, AdminOrganizationsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await adminOrgService.listOrganizations(req.query)
        return ApiResponse.success(res, result)
    }
)

export const createOrganization = catchAsync(
    async (
        req: TypedRequest<AdminCreateOrganizationBody, AdminOrganizationsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await adminOrgService.createOrganization(
            req.body as AdminCreateOrganizationBody
        )
        return ApiResponse.success(
            res,
            result,
            'Tạo tổ chức thành công',
            HttpStatus.CREATED
        )
    }
)

export const updateOrganization = catchAsync(
    async (
        req: TypedRequest<
            AdminUpdateOrganizationBody,
            AdminOrganizationsQuery,
            AdminOrganizationIdParams
        >,
        res: Response
    ) => {
        const result = await adminOrgService.updateOrganization(
            req.params.id!,
            req.body as AdminUpdateOrganizationBody
        )
        return ApiResponse.success(res, result, 'Cập nhật tổ chức thành công')
    }
)

export const deleteOrganization = catchAsync(
    async (
        req: TypedRequest<
            EmptyBody,
            AdminOrganizationsQuery,
            AdminOrganizationIdParams
        >,
        res: Response
    ) => {
        await adminOrgService.deleteOrganization(req.params.id!)
        res.sendStatus(HttpStatus.NO_CONTENT)
    }
)
