import type { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as workspaceService from './workspace.service'
import type {
    ExportWorkspaceReportPayload,
    ReviewContributionPayload,
    ReviewRegistrationPayload,
    UpdateMembershipStatusPayload,
    WorkspaceEntityRouteParams,
} from './workspace.types'

export const getManagerWorkspace = catchAsync(async (req, res: Response) => {
    const workspace = await workspaceService.getManagerWorkspace(req.payload)
    return ApiResponse.success(res, workspace)
})

export const handleUpdateMembershipStatus = catchAsync(
    async (
        req: TypedRequest<UpdateMembershipStatusPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as WorkspaceEntityRouteParams
        const membership = await workspaceService.updateMembershipStatus(
            req.payload,
            id,
            req.body as UpdateMembershipStatusPayload
        )

        return ApiResponse.success(res, membership, 'Membership updated successfully')
    }
)

export const handleReviewRegistration = catchAsync(
    async (
        req: TypedRequest<ReviewRegistrationPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as WorkspaceEntityRouteParams
        const registration = await workspaceService.reviewRegistration(
            req.payload,
            id,
            req.body as ReviewRegistrationPayload
        )

        return ApiResponse.success(
            res,
            registration,
            'Registration reviewed successfully'
        )
    }
)

export const handleReviewContribution = catchAsync(
    async (
        req: TypedRequest<ReviewContributionPayload>,
        res: Response
    ) => {
        const { id } = req.params as unknown as WorkspaceEntityRouteParams
        const contribution = await workspaceService.reviewContribution(
            req.payload,
            id,
            req.body as ReviewContributionPayload
        )

        return ApiResponse.success(
            res,
            contribution,
            'Contribution reviewed successfully'
        )
    }
)

export const handleSubmitCampaign = catchAsync(async (req, res: Response) => {
    const { id } = req.params as unknown as WorkspaceEntityRouteParams
    const campaign = await workspaceService.submitCampaign(req.payload, id)

    return ApiResponse.success(res, campaign, 'Campaign submitted successfully')
})

export const handleApproveCampaign = catchAsync(async (req, res: Response) => {
    const { id } = req.params as unknown as WorkspaceEntityRouteParams
    const campaign = await workspaceService.approveCampaign(req.payload, id)

    return ApiResponse.success(res, campaign, 'Campaign approved successfully')
})

export const handlePublishCampaign = catchAsync(async (req, res: Response) => {
    const { id } = req.params as unknown as WorkspaceEntityRouteParams
    const campaign = await workspaceService.publishCampaign(req.payload, id)

    return ApiResponse.success(res, campaign, 'Campaign published successfully')
})

export const handleExportWorkspaceReport = catchAsync(
    async (
        req: TypedRequest<ExportWorkspaceReportPayload>,
        res: Response
    ) => {
        const exportResult = await workspaceService.exportWorkspaceReport(
            req.payload,
            req.body as ExportWorkspaceReportPayload
        )

        return ApiResponse.success(
            res,
            exportResult,
            'Workspace report exported successfully',
            HttpStatus.CREATED
        )
    }
)
