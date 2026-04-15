import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as campaignController from '../campaign.controller'
import * as campaignService from '../campaign.service'
import { UserRole } from '../types'
import { CampaignStatus } from '@prisma/client'
import { ApiResponse } from 'src/utils/ApiResponse'

jest.mock('../campaign.service')

const mockResponse = () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('Campaign Controller', () => {
    let req: any
    let res: any

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            payload: undefined,
        }
        res = mockResponse()
        jest.clearAllMocks()
    })

    describe('createCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.body = { title: 'Test Campaign', description: 'Description' }
            req.payload = undefined

            await campaignController.createCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should return error if userId is missing', async () => {
            req.body = { title: 'Test Campaign', description: 'Description' }
            req.payload = { role: 'LCD' as UserRole }

            await campaignController.createCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should create campaign successfully for authenticated user', async () => {
            req.body = { title: 'Test Campaign', description: 'Description', scope: 'TRUONG' }
            req.payload = {
                userId: 'user-1',
                role: 'LCD' as UserRole,
                facultyId: 'faculty-1',
            }
            const mockCampaign = {
                id: 'campaign-1',
                title: 'Test Campaign',
                description: 'Description',
                status: 'DRAFT',
            }
            ;(campaignService.createCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.createCampaign(req, res)

            expect(campaignService.createCampaign).toHaveBeenCalledWith(
                req.body,
                'user-1',
                'LCD',
                'faculty-1'
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Tạo chiến dịch thành công',
                })
            )
        })

        it('should create campaign with DOANTRUONG role', async () => {
            req.body = { title: 'Test Campaign', description: 'Description', scope: 'TRUONG' }
            req.payload = {
                userId: 'user-1',
                role: 'DOANTRUONG' as UserRole,
                facultyId: null,
            }
            const mockCampaign = {
                id: 'campaign-1',
                title: 'Test Campaign',
                status: 'DRAFT',
            }
            ;(campaignService.createCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.createCampaign(req, res)

            expect(campaignService.createCampaign).toHaveBeenCalledWith(
                req.body,
                'user-1',
                'DOANTRUONG',
                null
            )
        })
    })

    describe('getCampaign', () => {
        it('should return campaign by id', async () => {
            req.params = { id: 'campaign-1' }
            const mockCampaign = {
                id: 'campaign-1',
                title: 'Test Campaign',
                description: 'Description',
            }
            ;(campaignService.getCampaignById as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.getCampaign(req, res)

            expect(campaignService.getCampaignById).toHaveBeenCalledWith('campaign-1')
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                })
            )
        })

        it('should return null for non-existent campaign', async () => {
            req.params = { id: 'non-existent' }
            ;(campaignService.getCampaignById as jest.Mock).mockResolvedValue(null)

            await campaignController.getCampaign(req, res)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: null,
                })
            )
        })
    })

    describe('updateCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { title: 'Updated Title' }
            req.payload = undefined

            await campaignController.updateCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should update campaign successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { title: 'Updated Title', description: 'Updated Description' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                title: 'Updated Title',
            }
            ;(campaignService.updateCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.updateCampaign(req, res)

            expect(campaignService.updateCampaign).toHaveBeenCalledWith(
                'campaign-1',
                req.body,
                'user-1',
                'LCD'
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Cập nhật chiến dịch thành công',
                })
            )
        })
    })

    describe('deleteCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = undefined

            await campaignController.deleteCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should delete campaign successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            ;(campaignService.deleteCampaign as jest.Mock).mockResolvedValue(undefined)

            await campaignController.deleteCampaign(req, res)

            expect(campaignService.deleteCampaign).toHaveBeenCalledWith('campaign-1', 'user-1', 'LCD')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: null,
                    message: 'Xóa chiến dịch thành công',
                })
            )
        })
    })

    describe('submitCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = undefined

            await campaignController.submitCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should submit campaign successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'PENDING' as CampaignStatus,
            }
            ;(campaignService.submitCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.submitCampaign(req, res)

            expect(campaignService.submitCampaign).toHaveBeenCalledWith('campaign-1', 'user-1', 'LCD')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Gửi phê duyệt chiến dịch thành công',
                })
            )
        })
    })

    describe('approveCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { comment: 'Approved!' }
            req.payload = undefined

            await campaignController.approveCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should approve campaign without comment', async () => {
            req.params = { id: 'campaign-1' }
            req.body = {}
            req.payload = { userId: 'user-1', role: 'DOANTRUONG' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'ACTIVE' as CampaignStatus,
            }
            ;(campaignService.approveCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.approveCampaign(req, res)

            expect(campaignService.approveCampaign).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                'DOANTRUONG',
                undefined
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Phê duyệt chiến dịch thành công',
                })
            )
        })

        it('should approve campaign with comment', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { comment: 'Great campaign!' }
            req.payload = { userId: 'user-1', role: 'DOANTRUONG' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'ACTIVE' as CampaignStatus,
            }
            ;(campaignService.approveCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.approveCampaign(req, res)

            expect(campaignService.approveCampaign).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                'DOANTRUONG',
                'Great campaign!'
            )
        })
    })

    describe('rejectCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { comment: 'Rejected!' }
            req.payload = undefined

            await campaignController.rejectCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should reject campaign successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { comment: 'Not approved' }
            req.payload = { userId: 'user-1', role: 'DOANTRUONG' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'REJECTED' as CampaignStatus,
            }
            ;(campaignService.rejectCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.rejectCampaign(req, res)

            expect(campaignService.rejectCampaign).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                'DOANTRUONG',
                'Not approved'
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Từ chối chiến dịch thành công',
                })
            )
        })
    })

    describe('completeCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { eventPhotos: ['photo1.jpg'] }
            req.payload = undefined

            await campaignController.completeCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should complete campaign without event photos', async () => {
            req.params = { id: 'campaign-1' }
            req.body = {}
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'COMPLETED' as CampaignStatus,
            }
            ;(campaignService.completeCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.completeCampaign(req, res)

            expect(campaignService.completeCampaign).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                'LCD',
                undefined
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Đánh dấu hoàn thành chiến dịch thành công',
                })
            )
        })

        it('should complete campaign with event photos', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { eventPhotos: ['photo1.jpg', 'photo2.jpg'] }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'COMPLETED' as CampaignStatus,
            }
            ;(campaignService.completeCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.completeCampaign(req, res)

            expect(campaignService.completeCampaign).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                'LCD',
                ['photo1.jpg', 'photo2.jpg']
            )
        })
    })

    describe('cancelCampaign', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = undefined

            await campaignController.cancelCampaign(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should cancel campaign successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                status: 'CANCELLED' as CampaignStatus,
            }
            ;(campaignService.cancelCampaign as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.cancelCampaign(req, res)

            expect(campaignService.cancelCampaign).toHaveBeenCalledWith('campaign-1', 'user-1', 'LCD')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Hủy chiến dịch thành công',
                })
            )
        })
    })

    describe('uploadPlanFile', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { planFileUrl: 'https://example.com/plan.pdf' }
            req.payload = undefined

            await campaignController.uploadPlanFile(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should upload plan file successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { planFileUrl: 'https://example.com/plan.pdf' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                planFileUrl: 'https://example.com/plan.pdf',
            }
            ;(campaignService.uploadPlanFile as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.uploadPlanFile(req, res)

            expect(campaignService.uploadPlanFile).toHaveBeenCalledWith(
                'campaign-1',
                'https://example.com/plan.pdf',
                'user-1',
                'LCD'
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Upload file kế hoạch thành công',
                })
            )
        })
    })

    describe('uploadBudgetFile', () => {
        it('should return error if user is not authenticated', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { budgetFileUrl: 'https://example.com/budget.xlsx' }
            req.payload = undefined

            await campaignController.uploadBudgetFile(req, res)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: 'Chưa xác thực người dùng',
                })
            )
        })

        it('should upload budget file successfully', async () => {
            req.params = { id: 'campaign-1' }
            req.body = { budgetFileUrl: 'https://example.com/budget.xlsx' }
            req.payload = { userId: 'user-1', role: 'LCD' as UserRole }
            const mockCampaign = {
                id: 'campaign-1',
                budgetFileUrl: 'https://example.com/budget.xlsx',
            }
            ;(campaignService.uploadBudgetFile as jest.Mock).mockResolvedValue(mockCampaign)

            await campaignController.uploadBudgetFile(req, res)

            expect(campaignService.uploadBudgetFile).toHaveBeenCalledWith(
                'campaign-1',
                'https://example.com/budget.xlsx',
                'user-1',
                'LCD'
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockCampaign,
                    message: 'Upload file dự trù ngân sách thành công',
                })
            )
        })
    })

    describe('getCampaigns', () => {
        it('should return campaigns with no filters', async () => {
            req.query = {}
            const mockResult = {
                campaigns: [
                    { id: 'campaign-1', title: 'Campaign 1' },
                    { id: 'campaign-2', title: 'Campaign 2' },
                ],
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
            }
            ;(campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getCampaigns(req, res)

            expect(campaignService.getCampaigns).toHaveBeenCalledWith({
                status: undefined,
                scope: undefined,
                facultyId: undefined,
                creatorId: undefined,
                page: undefined,
                limit: undefined,
            })
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockResult,
                })
            )
        })

        it('should return campaigns with filters', async () => {
            req.query = {
                status: 'ACTIVE',
                scope: 'TRUONG',
                facultyId: 'faculty-1',
                creatorId: 'user-1',
                page: '2',
                limit: '5',
            }
            const mockResult = {
                campaigns: [{ id: 'campaign-1', title: 'Campaign 1' }],
                meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
            }
            ;(campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getCampaigns(req, res)

            expect(campaignService.getCampaigns).toHaveBeenCalledWith({
                status: 'ACTIVE',
                scope: 'TRUONG',
                facultyId: 'faculty-1',
                creatorId: 'user-1',
                page: 2,
                limit: 5,
            })
        })

        it('should handle empty result', async () => {
            req.query = { status: 'CANCELLED' }
            const mockResult = {
                campaigns: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(campaignService.getCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getCampaigns(req, res)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockResult,
                })
            )
        })
    })

    describe('getAvailableCampaigns', () => {
        it('should return available campaigns for LCD role', async () => {
            req.query = { page: '1', limit: '10' }
            req.payload = { role: 'LCD' as UserRole, facultyId: 'faculty-1' }
            const mockResult = {
                campaigns: [{ id: 'campaign-1', title: 'Campaign 1' }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }
            ;(campaignService.getAvailableCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getAvailableCampaigns(req, res)

            expect(campaignService.getAvailableCampaigns).toHaveBeenCalledWith(
                'LCD',
                'faculty-1',
                1,
                10
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockResult,
                })
            )
        })

        it('should return available campaigns for DOANTRUONG role', async () => {
            req.query = { page: '2', limit: '5' }
            req.payload = { role: 'DOANTRUONG' as UserRole, facultyId: null }
            const mockResult = {
                campaigns: [{ id: 'campaign-1', title: 'Campaign 1' }],
                meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
            }
            ;(campaignService.getAvailableCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getAvailableCampaigns(req, res)

            expect(campaignService.getAvailableCampaigns).toHaveBeenCalledWith(
                'DOANTRUONG',
                null,
                2,
                5
            )
        })

        it('should use default pagination if not provided', async () => {
            req.query = {}
            req.payload = { role: 'LCD' as UserRole, facultyId: 'faculty-1' }
            const mockResult = {
                campaigns: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(campaignService.getAvailableCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getAvailableCampaigns(req, res)

            expect(campaignService.getAvailableCampaigns).toHaveBeenCalledWith(
                'LCD',
                'faculty-1',
                1,
                10
            )
        })

        it('should handle undefined payload', async () => {
            req.query = { page: '1', limit: '10' }
            req.payload = undefined
            const mockResult = {
                campaigns: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(campaignService.getAvailableCampaigns as jest.Mock).mockResolvedValue(mockResult)

            await campaignController.getAvailableCampaigns(req, res)

            expect(campaignService.getAvailableCampaigns).toHaveBeenCalledWith(
                undefined,
                undefined,
                1,
                10
            )
        })
    })
})
