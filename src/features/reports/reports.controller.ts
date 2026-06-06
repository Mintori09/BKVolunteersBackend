import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as catalogService from 'src/features/catalog/catalog.service'
import * as campaignsService from 'src/features/campaigns/campaigns.service'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

export const getSchoolOverview = catchAsync(async (req: Request, res: Response) => {
    const data = catalogService.getSchoolOverview({
        from: typeof req.query.from === 'string' ? req.query.from : undefined,
        to: typeof req.query.to === 'string' ? req.query.to : undefined,
        organization_id:
            typeof req.query.organization_id === 'string'
                ? req.query.organization_id
                : undefined,
        module_type:
            typeof req.query.module_type === 'string'
                ? req.query.module_type
                : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
    })

    return ApiResponse.success(res, data, 'Lay bao cao tong quan thanh cong')
})

export const getCampaignReport = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? '')
    const data =
        catalogService.getCampaignReport(id) ??
        (() => {
            const campaign = campaignsService.getManagedCampaignById(id)

            if (!campaign) {
                return null
            }

            const fundraisingModules = campaign.modules.filter(
                (module) => module.type === 'fundraising'
            )
            const itemModules = campaign.modules.filter(
                (module) => module.type === 'item_donation'
            )
            const eventModules = campaign.modules.filter(
                (module) => module.type === 'event'
            )

            return {
                campaign: {
                    id: Number(campaign.id.replace(/\D+/g, '')) || 0,
                    title: campaign.title,
                    slug: campaign.slug,
                    status: campaign.status,
                },
                modules: campaign.modules.map((module) => ({
                    id: Number(module.id.replace(/\D+/g, '')) || 0,
                    type: module.type,
                    status: module.status,
                })),
                fundraising: {
                    total_verified_amount: 0,
                    total_donations: fundraisingModules.length,
                    verified_donations: 0,
                },
                item_donations: {
                    received_quantity: itemModules.length,
                },
                events: {
                    registrations: eventModules.length,
                    completed_registrations: 0,
                    completed_hours: 0,
                },
                certificates: {
                    issued_total: 0,
                },
            }
        })()

    if (!data) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay bao cao chien dich')
    }

    return ApiResponse.success(res, data, 'Lay bao cao chien dich thanh cong')
})

export const getCampaignReconciliation = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data =
            catalogService.getCampaignReconciliation(id) ??
            (() => {
                const campaign = campaignsService.getManagedCampaignById(id)

                if (!campaign) {
                    return null
                }

                return {
                    campaign: {
                        id: Number(campaign.id.replace(/\D+/g, '')) || 0,
                        title: campaign.title,
                        slug: campaign.slug,
                        status: campaign.status,
                        organization_id: Number(campaign.organization_id) || 0,
                    },
                    reconciliation: {
                        matched_transactions: 0,
                        unmatched_transactions: 0,
                        total_transaction_amount: 0,
                        matched_transaction_amount: 0,
                        unmatched_transaction_amount: 0,
                        pending_donations: 0,
                        matched_donations: 0,
                        verified_donations: 0,
                        rejected_donations: 0,
                        verified_amount: 0,
                        amount_gap_vs_verified: 0,
                    },
                }
            })()

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay bao cao doi soat chien dich'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay bao cao doi soat chien dich thanh cong'
        )
    }
)
