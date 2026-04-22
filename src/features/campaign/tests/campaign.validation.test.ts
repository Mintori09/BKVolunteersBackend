import {
    createCampaignSchema,
    updateCampaignSchema,
    campaignIdSchema,
    approveCampaignSchema,
    rejectCampaignSchema,
    completeCampaignSchema,
    uploadPlanFileSchema,
    uploadBudgetFileSchema,
    getCampaignsSchema,
    getAvailableCampaignsSchema,
} from '../campaign.validation'
import { Request } from 'express'

describe('Campaign Validation', () => {
    let mockReq: Partial<Request>

    beforeEach(() => {
        mockReq = {
            body: {},
            params: {},
            query: {},
        }
        jest.clearAllMocks()
    })

    describe('createCampaignSchema', () => {
        it('should pass with valid data', () => {
            mockReq.body = {
                title: 'Test Campaign',
                description: 'Test Description',
                scope: 'TRUONG',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })

        it('should fail when title is missing', () => {
            mockReq.body = {
                description: 'Test Description',
                scope: 'TRUONG',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Tiêu đề không được để trống'
                )
            }
        })

        it('should fail when title is empty string', () => {
            mockReq.body = {
                title: '',
                scope: 'TRUONG',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should fail when title exceeds 255 characters', () => {
            mockReq.body = {
                title: 'a'.repeat(256),
                scope: 'TRUONG',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Tiêu đề không được quá 255 ký tự'
                )
            }
        })

        it('should fail when scope is invalid', () => {
            mockReq.body = {
                title: 'Test Campaign',
                scope: 'INVALID',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should pass with KHOA scope', () => {
            mockReq.body = {
                title: 'Test Campaign',
                scope: 'KHOA',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })

        it('should pass without description', () => {
            mockReq.body = {
                title: 'Test Campaign',
                scope: 'TRUONG',
            }

            const result = createCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })
    })

    describe('updateCampaignSchema', () => {
        it('should pass with valid data', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = {
                title: 'Updated Title',
                description: 'Updated Description',
            }

            const paramsResult = updateCampaignSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = updateCampaignSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should fail when id is missing', () => {
            mockReq.params = {}

            const result = updateCampaignSchema.params!.safeParse(mockReq.params)
            expect(result.success).toBe(false)
        })

        it('should fail when id is empty', () => {
            mockReq.params = { id: '' }

            const result = updateCampaignSchema.params!.safeParse(mockReq.params)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('ID không hợp lệ')
            }
        })

        it('should fail when title exceeds 255 characters', () => {
            mockReq.body = {
                title: 'a'.repeat(256),
            }

            const result = updateCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should pass with partial update', () => {
            mockReq.body = {
                title: 'Updated Title',
            }

            const result = updateCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })
    })

    describe('campaignIdSchema', () => {
        it('should pass with valid id', () => {
            mockReq.params = { id: 'campaign-123' }

            const result = campaignIdSchema.params!.safeParse(mockReq.params)
            expect(result.success).toBe(true)
        })

        it('should fail when id is missing', () => {
            mockReq.params = {}

            const result = campaignIdSchema.params!.safeParse(mockReq.params)
            expect(result.success).toBe(false)
        })

        it('should fail when id is empty', () => {
            mockReq.params = { id: '' }

            const result = campaignIdSchema.params!.safeParse(mockReq.params)
            expect(result.success).toBe(false)
        })
    })

    describe('approveCampaignSchema', () => {
        it('should pass with valid data', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = { comment: 'Approved' }

            const paramsResult = approveCampaignSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = approveCampaignSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should pass without comment', () => {
            mockReq.body = {}

            const result = approveCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })

        it('should fail when comment exceeds 1000 characters', () => {
            mockReq.body = { comment: 'a'.repeat(1001) }

            const result = approveCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Ghi chú không được quá 1000 ký tự'
                )
            }
        })
    })

    describe('rejectCampaignSchema', () => {
        it('should pass with valid data', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = { comment: 'Rejected reason' }

            const paramsResult = rejectCampaignSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = rejectCampaignSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should fail when comment is missing', () => {
            mockReq.body = {}

            const result = rejectCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should fail when comment is empty', () => {
            mockReq.body = { comment: '' }

            const result = rejectCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Lý do từ chối là bắt buộc'
                )
            }
        })

        it('should fail when comment exceeds 1000 characters', () => {
            mockReq.body = { comment: 'a'.repeat(1001) }

            const result = rejectCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })
    })

    describe('completeCampaignSchema', () => {
        it('should pass with valid data', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = {
                eventPhotos: [
                    'https://example.com/photo1.jpg',
                    'https://example.com/photo2.jpg',
                ],
            }

            const paramsResult = completeCampaignSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = completeCampaignSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should pass without eventPhotos', () => {
            mockReq.body = {}

            const result = completeCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(true)
        })

        it('should fail when eventPhotos contains invalid URL', () => {
            mockReq.body = { eventPhotos: ['not-a-url'] }

            const result = completeCampaignSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })
    })

    describe('uploadPlanFileSchema', () => {
        it('should pass with valid URL', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = { planFileUrl: 'https://example.com/plan.pdf' }

            const paramsResult = uploadPlanFileSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = uploadPlanFileSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should fail when planFileUrl is missing', () => {
            mockReq.body = {}

            const result = uploadPlanFileSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should fail when planFileUrl is not a valid URL', () => {
            mockReq.body = { planFileUrl: 'not-a-url' }

            const result = uploadPlanFileSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'URL file không hợp lệ'
                )
            }
        })
    })

    describe('uploadBudgetFileSchema', () => {
        it('should pass with valid URL', () => {
            mockReq.params = { id: 'campaign-123' }
            mockReq.body = { budgetFileUrl: 'https://example.com/budget.xlsx' }

            const paramsResult = uploadBudgetFileSchema.params!.safeParse(
                mockReq.params
            )
            const bodyResult = uploadBudgetFileSchema.body!.safeParse(mockReq.body)
            expect(paramsResult.success).toBe(true)
            expect(bodyResult.success).toBe(true)
        })

        it('should fail when budgetFileUrl is missing', () => {
            mockReq.body = {}

            const result = uploadBudgetFileSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })

        it('should fail when budgetFileUrl is not a valid URL', () => {
            mockReq.body = { budgetFileUrl: 'not-a-url' }

            const result = uploadBudgetFileSchema.body!.safeParse(mockReq.body)
            expect(result.success).toBe(false)
        })
    })

    describe('getCampaignsSchema', () => {
        it('should pass with valid query params', () => {
            mockReq.query = {
                status: 'DRAFT',
                scope: 'TRUONG',
                facultyId: '1',
                creatorId: 'user-123',
                page: '1',
                limit: '10',
            }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(true)
        })

        it('should pass without any query params', () => {
            mockReq.query = {}

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(true)
        })

        it('should fail when status is invalid', () => {
            mockReq.query = { status: 'INVALID' }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(false)
        })

        it('should fail when scope is invalid', () => {
            mockReq.query = { scope: 'INVALID' }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(false)
        })

        it('should fail when page is not a number', () => {
            mockReq.query = { page: 'abc' }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(false)
        })

        it('should fail when limit is not a number', () => {
            mockReq.query = { limit: 'abc' }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(false)
        })

        it('should coerce facultyId to number', () => {
            mockReq.query = { facultyId: '123' }

            const result = getCampaignsSchema.query!.safeParse(mockReq.query)
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.facultyId).toBe(123)
            }
        })
    })

    describe('getAvailableCampaignsSchema', () => {
        it('should pass with valid query params', () => {
            mockReq.query = {
                page: '1',
                limit: '10',
            }

            const result = getAvailableCampaignsSchema.query!.safeParse(
                mockReq.query
            )
            expect(result.success).toBe(true)
        })

        it('should pass without any query params', () => {
            mockReq.query = {}

            const result = getAvailableCampaignsSchema.query!.safeParse(
                mockReq.query
            )
            expect(result.success).toBe(true)
        })

        it('should fail when page is not a number', () => {
            mockReq.query = { page: 'abc' }

            const result = getAvailableCampaignsSchema.query!.safeParse(
                mockReq.query
            )
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Page phải là số nguyên dương'
                )
            }
        })

        it('should fail when limit is not a number', () => {
            mockReq.query = { limit: 'abc' }

            const result = getAvailableCampaignsSchema.query!.safeParse(
                mockReq.query
            )
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Limit phải là số nguyên dương'
                )
            }
        })
    })
})