import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as catalogService from 'src/features/catalog/catalog.service'
import * as campaignsService from 'src/features/campaigns/campaigns.service'

export const listPublicCampaigns = catchAsync(
    async (req: Request, res: Response) => {
        const data = catalogService.listPublicCampaigns({
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            organization_id:
                typeof req.query.organization_id === 'string'
                    ? req.query.organization_id
                    : undefined,
            module_type:
                typeof req.query.module_type === 'string'
                    ? req.query.module_type
                    : undefined,
            status:
                typeof req.query.status === 'string' ? req.query.status : undefined,
            page:
                typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
            limit:
                typeof req.query.limit === 'string'
                    ? Number(req.query.limit)
                    : undefined,
        })

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach chien dich cong khai thanh cong'
        )
    }
)

export const getPublicCampaignDetail = catchAsync(
    async (req: Request, res: Response) => {
        const slug = String(req.params.slug ?? '')
        const data =
            catalogService.getPublicCampaignBySlug(slug) ??
            (() => {
                const campaign = campaignsService.findManagedCampaignBySlug(slug)

                if (
                    !campaign ||
                    !['PUBLISHED', 'ONGOING'].includes(campaign.status) ||
                    campaign.scope_type !== 'PUBLIC'
                ) {
                    return null
                }

                return {
                    id: campaign.id,
                    slug: campaign.slug,
                    title: campaign.title,
                    summary: campaign.summary,
                    description: campaign.description ?? null,
                    cover_image_url: campaign.cover_image_url ?? null,
                    organization: campaign.organization
                        ? {
                              id: campaign.organization.id,
                              code: campaign.organization.code,
                              name: campaign.organization.name,
                              type: campaign.organization.type,
                              logo_url: null,
                          }
                        : {
                              id: campaign.organization_id,
                              code: '',
                              name: 'Unknown organization',
                              type: 'UNKNOWN',
                              logo_url: null,
                          },
                    module_types: campaign.modules.map((module) => module.type),
                    status: campaign.status,
                    start_at: campaign.start_at,
                    end_at: campaign.end_at,
                    progress: {
                        percent: 0,
                        modules: campaign.modules.map((module) => ({
                            type: module.type,
                            current: 0,
                            target: 0,
                            percent: 0,
                        })),
                    },
                    beneficiary: campaign.beneficiary ?? null,
                    scope_type: campaign.scope_type,
                    published_at: campaign.published_at ?? null,
                    modules: campaign.modules.map((module) => ({
                        id: module.id,
                        type: module.type,
                        title: module.title,
                        description: module.description ?? null,
                        status: module.status,
                        start_at: module.start_at,
                        end_at: module.end_at,
                        settings: { ...module.settings },
                        progress: {
                            type: module.type,
                            current: 0,
                            target: 0,
                            percent: 0,
                        },
                        cta: {
                            enabled: module.status !== 'CANCELLED',
                            label:
                                module.type === 'event'
                                    ? 'Dang mo dang ky'
                                    : module.type === 'fundraising'
                                      ? 'Ung ho ngay'
                                      : 'Dang ky hien vat',
                            action:
                                module.type === 'event'
                                    ? 'register'
                                    : module.type === 'fundraising'
                                      ? 'donate'
                                      : 'pledge-item',
                        },
                    })),
                }
            })()

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich cong khai')
        }

        return ApiResponse.success(res, data, 'Lay chi tiet chien dich cong khai thanh cong')
    }
)
