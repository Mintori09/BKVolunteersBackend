import type { NextFunction, Request, Response } from 'express'
import isAuth from './isAuth'
import { ApiResponse } from 'src/utils/ApiResponse'
import type { AccountType, ContractRole } from 'src/contract/types'

const forbidden = (res: Response, code: string, message: string) =>
    ApiResponse.error(res, message, 403, undefined, code)

export const requireAuth = isAuth

export const requireRoles =
    (roles: ContractRole[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.payload?.role || !roles.includes(req.payload.role)) {
            return forbidden(
                res,
                'FORBIDDEN_ROLE',
                'You do not have permission to perform this action'
            )
        }

        next()
    }

export const requireAccountType =
    (accountType: AccountType) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (req.payload?.accountType !== accountType) {
            return forbidden(
                res,
                'FORBIDDEN_ACCOUNT_TYPE',
                'This endpoint is not available for the current account type'
            )
        }

        next()
    }

export const requireOrgScope =
    (getOrganizationId: (req: Request) => string | number | bigint | null | undefined) =>
    (req: Request, res: Response, next: NextFunction) => {
        const scopedOrganizationId = getOrganizationId(req)
        const currentOrganizationId = req.payload?.organizationId

        if (
            scopedOrganizationId == null ||
            currentOrganizationId == null ||
            String(scopedOrganizationId) !== String(currentOrganizationId)
        ) {
            return forbidden(
                res,
                'FORBIDDEN_ORGANIZATION_SCOPE',
                'You can only access resources in your organization'
            )
        }

        next()
    }
