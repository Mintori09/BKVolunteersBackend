import { Request, Response } from 'express'
import { ApiResponse } from 'src/utils/ApiResponse'

type ContractPayload = Record<string, unknown> | unknown[]

export const emptyList = (resource: string) => ({
    items: [],
    resource,
})

export const contractReady = (
    res: Response,
    data: ContractPayload = {},
    message = 'Contract endpoint is ready'
) => ApiResponse.success(res, data, message)

export const contractList = (req: Request, res: Response, resource: string) =>
    ApiResponse.success(
        res,
        [],
        `${resource} fetched successfully`,
        200,
        {
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 10),
            total: 0,
            total_pages: 0,
        }
    )

export const contractMutation = (
    _req: Request,
    res: Response,
    resource: string,
    state?: string
) =>
    ApiResponse.success(res, {
        resource,
        ...(state && { status: state }),
        contract_only: true,
    })

