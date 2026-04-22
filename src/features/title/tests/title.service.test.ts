import * as titleService from '../title.service'
import * as titleRepository from '../title.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

jest.mock('../title.repository')

describe('Title Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createTitle', () => {
        it('should create a title successfully when minPoints is unique', async () => {
            const input = {
                name: 'Gold Member',
                description: 'Gold level membership',
                minPoints: 100,
                iconUrl: 'https://example.com/gold.png',
                badgeColor: '#FFD700',
            }
            const mockTitle = {
                id: 1,
                ...input,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: [{ id: 2, minPoints: 50 }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })
            ;(titleRepository.create as jest.Mock).mockResolvedValue(mockTitle)

            const result = await titleService.createTitle(input)

            expect(titleRepository.findMany).toHaveBeenCalledWith({ limit: 1 })
            expect(titleRepository.create).toHaveBeenCalledWith(input)
            expect(result).toEqual(mockTitle)
        })

        it('should throw ApiError when minPoints already exists', async () => {
            const input = {
                name: 'Duplicate',
                minPoints: 100,
            }
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: [{ id: 1, minPoints: 100 }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })

            await expect(titleService.createTitle(input)).rejects.toThrow(
                new ApiError(
                    HttpStatus.BAD_REQUEST,
                    'Đã tồn tại danh hiệu với mức điểm này'
                )
            )
            expect(titleRepository.create).not.toHaveBeenCalled()
        })

        it('should create title when no existing titles', async () => {
            const input = {
                name: 'First Title',
                minPoints: 10,
            }
            const mockTitle = {
                id: 1,
                ...input,
                description: null,
                iconUrl: null,
                badgeColor: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            })
            ;(titleRepository.create as jest.Mock).mockResolvedValue(mockTitle)

            const result = await titleService.createTitle(input)

            expect(titleRepository.create).toHaveBeenCalledWith(input)
            expect(result).toEqual(mockTitle)
        })

        it('should allow creating title with minPoints 0', async () => {
            const input = {
                name: 'Zero Points',
                minPoints: 0,
            }
            const mockTitle = {
                id: 1,
                ...input,
                isActive: true,
            }
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: [{ id: 2, minPoints: 100 }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })
            ;(titleRepository.create as jest.Mock).mockResolvedValue(mockTitle)

            const result = await titleService.createTitle(input)

            expect(result).toEqual(mockTitle)
        })

        it('should propagate database errors from findMany', async () => {
            const input = { name: 'Test', minPoints: 50 }
            ;(titleRepository.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.createTitle(input)).rejects.toThrow(
                'Database error'
            )
        })

        it('should propagate database errors from create', async () => {
            const input = { name: 'Test', minPoints: 50 }
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            })
            ;(titleRepository.create as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.createTitle(input)).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('updateTitle', () => {
        it('should update a title successfully when it exists', async () => {
            const updateData = {
                name: 'Updated Name',
                description: 'Updated description',
            }
            const existingTitle = {
                id: 1,
                name: 'Old Name',
                minPoints: 100,
                isActive: true,
            }
            const updatedTitle = {
                ...existingTitle,
                ...updateData,
            }
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(
                existingTitle
            )
            ;(titleRepository.updateById as jest.Mock).mockResolvedValue(
                updatedTitle
            )

            const result = await titleService.updateTitle(1, updateData)

            expect(titleRepository.findById).toHaveBeenCalledWith(1)
            expect(titleRepository.updateById).toHaveBeenCalledWith(1, updateData)
            expect(result).toEqual(updatedTitle)
        })

        it('should throw ApiError when title does not exist', async () => {
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(null)

            await expect(
                titleService.updateTitle(999, { name: 'Test' })
            ).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
            )
            expect(titleRepository.updateById).not.toHaveBeenCalled()
        })

        it('should update isActive field', async () => {
            const existingTitle = {
                id: 1,
                name: 'Test',
                minPoints: 100,
                isActive: true,
            }
            const updatedTitle = { ...existingTitle, isActive: false }
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(
                existingTitle
            )
            ;(titleRepository.updateById as jest.Mock).mockResolvedValue(
                updatedTitle
            )

            const result = await titleService.updateTitle(1, { isActive: false })

            expect(result.isActive).toBe(false)
        })

        it('should propagate database errors from findById', async () => {
            ;(titleRepository.findById as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                titleService.updateTitle(1, { name: 'Test' })
            ).rejects.toThrow('Database error')
        })

        it('should propagate database errors from updateById', async () => {
            ;(titleRepository.findById as jest.Mock).mockResolvedValue({
                id: 1,
            })
            ;(titleRepository.updateById as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                titleService.updateTitle(1, { name: 'Test' })
            ).rejects.toThrow('Database error')
        })
    })

    describe('deleteTitle', () => {
        it('should delete a title successfully when it exists', async () => {
            const existingTitle = {
                id: 1,
                name: 'Test',
                minPoints: 100,
                isActive: true,
            }
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(
                existingTitle
            )
            ;(titleRepository.deleteById as jest.Mock).mockResolvedValue(
                existingTitle
            )

            await titleService.deleteTitle(1)

            expect(titleRepository.findById).toHaveBeenCalledWith(1)
            expect(titleRepository.deleteById).toHaveBeenCalledWith(1)
        })

        it('should throw ApiError when title does not exist', async () => {
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(null)

            await expect(titleService.deleteTitle(999)).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
            )
            expect(titleRepository.deleteById).not.toHaveBeenCalled()
        })

        it('should propagate database errors from findById', async () => {
            ;(titleRepository.findById as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.deleteTitle(1)).rejects.toThrow(
                'Database error'
            )
        })

        it('should propagate database errors from deleteById', async () => {
            ;(titleRepository.findById as jest.Mock).mockResolvedValue({ id: 1 })
            ;(titleRepository.deleteById as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.deleteTitle(1)).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('getAllTitles', () => {
        it('should return paginated titles without filters', async () => {
            const mockTitles = [
                { id: 1, name: 'Bronze', minPoints: 10, isActive: true },
                { id: 2, name: 'Silver', minPoints: 50, isActive: true },
            ]
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: mockTitles,
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
            })

            const result = await titleService.getAllTitles({})

            expect(titleRepository.findMany).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: undefined,
            })
            expect(result.items).toHaveLength(2)
        })

        it('should return paginated titles with isActive filter true', async () => {
            const mockTitles = [
                { id: 1, name: 'Active', minPoints: 10, isActive: true },
            ]
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: mockTitles,
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })

            const result = await titleService.getAllTitles({ isActive: true })

            expect(titleRepository.findMany).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: true,
            })
            expect(result.items).toHaveLength(1)
        })

        it('should return paginated titles with isActive filter false', async () => {
            const mockTitles = [
                { id: 2, name: 'Inactive', minPoints: 0, isActive: false },
            ]
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: mockTitles,
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })

            const result = await titleService.getAllTitles({ isActive: false })

            expect(titleRepository.findMany).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: false,
            })
            expect(result.items).toHaveLength(1)
        })

        it('should return paginated titles with page and limit', async () => {
            const mockTitles = [{ id: 3, name: 'Gold', minPoints: 100 }]
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: mockTitles,
                meta: { total: 25, page: 2, limit: 5, totalPages: 5 },
            })

            const result = await titleService.getAllTitles({
                page: 2,
                limit: 5,
            })

            expect(titleRepository.findMany).toHaveBeenCalledWith({
                page: 2,
                limit: 5,
                isActive: undefined,
            })
            expect(result.meta.page).toBe(2)
            expect(result.meta.limit).toBe(5)
        })

        it('should return paginated titles with all filters', async () => {
            const mockTitles = [{ id: 1, name: 'Test', minPoints: 10 }]
            ;(titleRepository.findMany as jest.Mock).mockResolvedValue({
                items: mockTitles,
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })

            const result = await titleService.getAllTitles({
                page: 1,
                limit: 10,
                isActive: true,
            })

            expect(titleRepository.findMany).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                isActive: true,
            })
            expect(result.items).toHaveLength(1)
        })

        it('should propagate database errors', async () => {
            ;(titleRepository.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.getAllTitles({})).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('getTitleById', () => {
        it('should return title when found', async () => {
            const mockTitle = {
                id: 1,
                name: 'Gold Member',
                minPoints: 100,
                isActive: true,
            }
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(mockTitle)

            const result = await titleService.getTitleById(1)

            expect(titleRepository.findById).toHaveBeenCalledWith(1)
            expect(result).toEqual(mockTitle)
        })

        it('should throw ApiError when title not found', async () => {
            ;(titleRepository.findById as jest.Mock).mockResolvedValue(null)

            await expect(titleService.getTitleById(999)).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
            )
        })

        it('should propagate database errors', async () => {
            ;(titleRepository.findById as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(titleService.getTitleById(1)).rejects.toThrow(
                'Database error'
            )
        })
    })
})