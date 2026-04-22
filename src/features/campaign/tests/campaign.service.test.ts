import * as campaignService from '../campaign.service'
import * as campaignRepository from '../campaign.repository'
import * as campaignPermission from '../campaign.permission'
import * as campaignStatus from '../campaign.status'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CampaignStatus, CampaignScope } from '@prisma/client'

jest.mock('../campaign.repository')
jest.mock('../campaign.permission')
jest.mock('../campaign.status')

describe('Campaign Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const mockCampaign = {
        id: 'campaign-1',
        title: 'Test Campaign',
        description: 'Test Description',
        scope: 'TRUONG' as CampaignScope,
        status: 'DRAFT' as CampaignStatus,
        creatorId: 'user-1',
        approverId: null,
        adminComment: null,
        planFileUrl: null,
        budgetFileUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    }

    describe('createCampaign', () => {
        const createInput = {
            title: 'New Campaign',
            description: 'Description',
            scope: 'TRUONG' as CampaignScope,
        }

        it('should create campaign successfully for CLB with TRUONG scope', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const userFacultyId = null

            ;(
                campaignPermission.canCreateCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(campaignRepository.createCampaign as jest.Mock).mockResolvedValue(
                {
                    ...mockCampaign,
                    ...createInput,
                    creatorId: userId,
                }
            )

            const result = await campaignService.createCampaign(
                createInput,
                userId,
                userRole,
                userFacultyId
            )

            expect(campaignPermission.canCreateCampaign).toHaveBeenCalledWith(
                userRole,
                createInput.scope,
                userFacultyId
            )
            expect(campaignRepository.createCampaign).toHaveBeenCalledWith({
                ...createInput,
                creatorId: userId,
            })
            expect(result).toMatchObject({
                title: createInput.title,
                creatorId: userId,
            })
        })

        it('should throw FORBIDDEN when user is SINHVIEN', async () => {
            const userId = 'student-1'
            const userRole = 'SINHVIEN'
            const userFacultyId = '102'

            ;(
                campaignPermission.canCreateCampaign as jest.Mock
            ).mockReturnValue({
                allowed: false,
                message: 'Bạn không có quyền tạo chiến dịch',
            })

            await expect(
                campaignService.createCampaign(
                    createInput,
                    userId,
                    userRole,
                    userFacultyId
                )
            ).rejects.toThrow(ApiError)
            await expect(
                campaignService.createCampaign(
                    createInput,
                    userId,
                    userRole,
                    userFacultyId
                )
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw FORBIDDEN when CLB tries to create KHOA scope campaign', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const userFacultyId = '102'
            const khoaInput = { ...createInput, scope: 'KHOA' as CampaignScope }

            ;(
                campaignPermission.canCreateCampaign as jest.Mock
            ).mockReturnValue({
                allowed: false,
                message: 'CLB không thể tạo chiến dịch cấp khoa',
            })

            await expect(
                campaignService.createCampaign(
                    khoaInput,
                    userId,
                    userRole,
                    userFacultyId
                )
            ).rejects.toThrow(ApiError)
        })
    })

    describe('getCampaignById', () => {
        it('should return campaign when found', async () => {
            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)

            const result = await campaignService.getCampaignById('campaign-1')

            expect(campaignRepository.findCampaignById).toHaveBeenCalledWith(
                'campaign-1'
            )
            expect(result).toEqual(mockCampaign)
        })

        it('should throw NOT_FOUND when campaign not found', async () => {
            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(null)

            await expect(
                campaignService.getCampaignById('nonexistent')
            ).rejects.toThrow(ApiError)
            await expect(
                campaignService.getCampaignById('nonexistent')
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })
    })

    describe('updateCampaign', () => {
        const updateInput = { title: 'Updated Title' }

        it('should update campaign when user is creator and status is DRAFT', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(campaignPermission.canEditCampaign as jest.Mock).mockReturnValue({
                allowed: true,
            })
            ;(campaignRepository.updateCampaign as jest.Mock).mockResolvedValue(
                {
                    ...mockCampaign,
                    ...updateInput,
                }
            )

            const result = await campaignService.updateCampaign(
                'campaign-1',
                updateInput,
                userId,
                userRole
            )

            expect(result.title).toBe(updateInput.title)
        })

        it('should throw FORBIDDEN when user is not creator', async () => {
            const userId = 'user-2'
            const userRole = 'CLB'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(campaignPermission.canEditCampaign as jest.Mock).mockReturnValue({
                allowed: false,
                message: 'Bạn không có quyền chỉnh sửa chiến dịch này',
            })

            await expect(
                campaignService.updateCampaign(
                    'campaign-1',
                    updateInput,
                    userId,
                    userRole
                )
            ).rejects.toThrow(ApiError)
        })
    })

    describe('deleteCampaign', () => {
        it('should soft delete campaign when user has permission', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(
                campaignPermission.canDeleteCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignRepository.softDeleteCampaign as jest.Mock
            ).mockResolvedValue(mockCampaign)

            await campaignService.deleteCampaign('campaign-1', userId, userRole)

            expect(campaignRepository.softDeleteCampaign).toHaveBeenCalledWith(
                'campaign-1'
            )
        })

        it('should throw FORBIDDEN when trying to delete non-DRAFT campaign', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const activeCampaign = {
                ...mockCampaign,
                status: 'ACTIVE' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(activeCampaign)
            ;(
                campaignPermission.canDeleteCampaign as jest.Mock
            ).mockReturnValue({
                allowed: false,
                message: 'Chỉ có thể xóa chiến dịch ở trạng thái DRAFT',
            })

            await expect(
                campaignService.deleteCampaign('campaign-1', userId, userRole)
            ).rejects.toThrow(ApiError)
        })
    })

    describe('submitCampaign', () => {
        it('should submit campaign for approval (DRAFT -> PENDING)', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(
                campaignPermission.canSubmitCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignStatus.isCampaignSubmittable as jest.Mock
            ).mockReturnValue(true)
            ;(
                campaignStatus.validateStatusTransition as jest.Mock
            ).mockReturnValue({
                valid: true,
            })
            ;(
                campaignRepository.updateCampaignStatus as jest.Mock
            ).mockResolvedValue({ ...mockCampaign, status: 'PENDING' })

            const result = await campaignService.submitCampaign(
                'campaign-1',
                userId,
                userRole
            )

            expect(result.status).toBe('PENDING')
            expect(
                campaignRepository.updateCampaignStatus
            ).toHaveBeenCalledWith('campaign-1', 'PENDING')
        })

        it('should throw error when campaign is not in DRAFT status', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const pendingCampaign = {
                ...mockCampaign,
                status: 'PENDING' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(pendingCampaign)
            ;(
                campaignPermission.canSubmitCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignStatus.isCampaignSubmittable as jest.Mock
            ).mockReturnValue(false)

            await expect(
                campaignService.submitCampaign('campaign-1', userId, userRole)
            ).rejects.toThrow(ApiError)
        })
    })

    describe('approveCampaign', () => {
        it('should approve campaign for DOANTRUONG (PENDING -> ACTIVE)', async () => {
            const userId = 'approver-1'
            const userRole = 'DOANTRUONG'
            const comment = 'Chiến dịch phù hợp'
            const pendingCampaign = {
                ...mockCampaign,
                status: 'PENDING' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(pendingCampaign)
            ;(
                campaignPermission.canApproveCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(campaignStatus.isCampaignApprovable as jest.Mock).mockReturnValue(
                true
            )
            ;(
                campaignStatus.validateStatusTransition as jest.Mock
            ).mockReturnValue({
                valid: true,
            })
            ;(
                campaignRepository.updateCampaignStatus as jest.Mock
            ).mockResolvedValue({
                ...pendingCampaign,
                status: 'ACTIVE',
                approverId: userId,
                adminComment: comment,
            })

            const result = await campaignService.approveCampaign(
                'campaign-1',
                userId,
                userRole,
                comment
            )

            expect(result.status).toBe('ACTIVE')
            expect(
                campaignRepository.updateCampaignStatus
            ).toHaveBeenCalledWith('campaign-1', 'ACTIVE', {
                approverId: userId,
                adminComment: comment,
            })
        })

        it('should throw FORBIDDEN when non-DOANTRUONG tries to approve', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const pendingCampaign = {
                ...mockCampaign,
                status: 'PENDING' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(pendingCampaign)
            ;(
                campaignPermission.canApproveCampaign as jest.Mock
            ).mockReturnValue({
                allowed: false,
                message: 'Chỉ Đoàn trường có quyền phê duyệt chiến dịch',
            })

            await expect(
                campaignService.approveCampaign(
                    'campaign-1',
                    userId,
                    userRole,
                    'comment'
                )
            ).rejects.toThrow(ApiError)
        })
    })

    describe('rejectCampaign', () => {
        it('should reject campaign with comment (PENDING -> REJECTED)', async () => {
            const userId = 'approver-1'
            const userRole = 'DOANTRUONG'
            const comment = 'Kế hoạch chưa chi tiết'
            const pendingCampaign = {
                ...mockCampaign,
                status: 'PENDING' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(pendingCampaign)
            ;(
                campaignPermission.canRejectCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(campaignStatus.isCampaignRejectable as jest.Mock).mockReturnValue(
                true
            )
            ;(
                campaignStatus.validateStatusTransition as jest.Mock
            ).mockReturnValue({
                valid: true,
            })
            ;(
                campaignRepository.updateCampaignStatus as jest.Mock
            ).mockResolvedValue({
                ...pendingCampaign,
                status: 'REJECTED',
                approverId: userId,
                adminComment: comment,
            })

            const result = await campaignService.rejectCampaign(
                'campaign-1',
                userId,
                userRole,
                comment
            )

            expect(result.status).toBe('REJECTED')
        })
    })

    describe('completeCampaign', () => {
        it('should complete campaign (ACTIVE -> COMPLETED)', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const eventPhotos = ['https://example.com/photo1.jpg']
            const activeCampaign = {
                ...mockCampaign,
                status: 'ACTIVE' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(activeCampaign)
            ;(
                campaignPermission.canCompleteCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignStatus.isCampaignCompletable as jest.Mock
            ).mockReturnValue(true)
            ;(
                campaignStatus.validateStatusTransition as jest.Mock
            ).mockReturnValue({
                valid: true,
            })
            ;(
                campaignRepository.updateCampaignStatus as jest.Mock
            ).mockResolvedValue({
                ...activeCampaign,
                status: 'COMPLETED',
            })

            const result = await campaignService.completeCampaign(
                'campaign-1',
                userId,
                userRole,
                eventPhotos
            )

            expect(result.status).toBe('COMPLETED')
        })
    })

    describe('cancelCampaign', () => {
        it('should cancel campaign (ACTIVE -> CANCELLED)', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const activeCampaign = {
                ...mockCampaign,
                status: 'ACTIVE' as CampaignStatus,
            }

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(activeCampaign)
            ;(
                campaignPermission.canCancelCampaign as jest.Mock
            ).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignStatus.isCampaignCancellable as jest.Mock
            ).mockReturnValue(true)
            ;(
                campaignStatus.validateStatusTransition as jest.Mock
            ).mockReturnValue({
                valid: true,
            })
            ;(
                campaignRepository.updateCampaignStatus as jest.Mock
            ).mockResolvedValue({
                ...activeCampaign,
                status: 'CANCELLED',
            })

            const result = await campaignService.cancelCampaign(
                'campaign-1',
                userId,
                userRole
            )

            expect(result.status).toBe('CANCELLED')
        })
    })

    describe('uploadPlanFile', () => {
        it('should upload plan file URL', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const planFileUrl = 'https://example.com/plan.pdf'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(campaignPermission.canUploadFile as jest.Mock).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignRepository.updatePlanFileUrl as jest.Mock
            ).mockResolvedValue({
                ...mockCampaign,
                planFileUrl,
            })

            const result = await campaignService.uploadPlanFile(
                'campaign-1',
                planFileUrl,
                userId,
                userRole
            )

            expect(result.planFileUrl).toBe(planFileUrl)
        })
    })

    describe('uploadBudgetFile', () => {
        it('should upload budget file URL', async () => {
            const userId = 'user-1'
            const userRole = 'CLB'
            const budgetFileUrl = 'https://example.com/budget.xlsx'

            ;(
                campaignRepository.findCampaignById as jest.Mock
            ).mockResolvedValue(mockCampaign)
            ;(campaignPermission.canUploadFile as jest.Mock).mockReturnValue({
                allowed: true,
            })
            ;(
                campaignRepository.updateBudgetFileUrl as jest.Mock
            ).mockResolvedValue({
                ...mockCampaign,
                budgetFileUrl,
            })

            const result = await campaignService.uploadBudgetFile(
                'campaign-1',
                budgetFileUrl,
                userId,
                userRole
            )

            expect(result.budgetFileUrl).toBe(budgetFileUrl)
        })
    })

    describe('getCampaigns', () => {
        it('should return campaigns with pagination', async () => {
            const query = { page: 1, limit: 10 }
            const mockResult = {
                campaigns: [mockCampaign],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }

            ;(
                campaignRepository.findCampaignsWithFilter as jest.Mock
            ).mockResolvedValue(mockResult)

            const result = await campaignService.getCampaigns(query)

            expect(result).toEqual(mockResult)
            expect(
                campaignRepository.findCampaignsWithFilter
            ).toHaveBeenCalledWith(query)
        })
    })

    describe('getAvailableCampaigns', () => {
        it('should return available campaigns for student', async () => {
            const userRole = 'SINHVIEN'
            const userFacultyId = '102'
            const mockResult = {
                campaigns: [{ ...mockCampaign, status: 'ACTIVE' }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }

            ;(
                campaignRepository.findAvailableCampaigns as jest.Mock
            ).mockResolvedValue(mockResult)

            const result = await campaignService.getAvailableCampaigns(
                userRole,
                userFacultyId
            )

            expect(result).toEqual(mockResult)
        })
    })
})
