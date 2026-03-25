import { paginate } from 'src/utils/paginate'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

describe('paginate util', () => {
    let mockModel: any

    beforeEach(() => {
        mockModel = {
            findMany: jest.fn(),
            count: jest.fn(),
        }
    })

    it('should paginate results with default options', async () => {
        const mockData = [{ id: 1 }, { id: 2 }]
        const mockTotal = 20

        mockModel.findMany.mockResolvedValue(mockData)
        mockModel.count.mockResolvedValue(mockTotal)

        const result = await paginate(mockModel)

        expect(result.data).toEqual(mockData)
        expect(result.meta).toEqual({
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2,
        })

        expect(mockModel.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            })
        )
    })

    it('should handle custom page and limit', async () => {
        mockModel.findMany.mockResolvedValue([])
        mockModel.count.mockResolvedValue(50)

        const result = await paginate(mockModel, { page: 3, limit: 5 })

        expect(result.meta).toEqual({
            total: 50,
            page: 3,
            limit: 5,
            totalPages: 10,
        })

        expect(mockModel.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 10,
                take: 5,
            })
        )
    })

    it('should handle sorting', async () => {
        mockModel.findMany.mockResolvedValue([])
        mockModel.count.mockResolvedValue(0)

        await paginate(mockModel, { sortBy: 'name', sortOrder: 'asc' })

        expect(mockModel.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { name: 'asc' },
            })
        )
    })

    it('should handle search', async () => {
        mockModel.findMany.mockResolvedValue([])
        mockModel.count.mockResolvedValue(0)

        await paginate(mockModel, {
            search: 'test',
            searchFields: ['email', 'firstName'],
        })

        expect(mockModel.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    OR: [
                        { email: { contains: 'test' } },
                        { firstName: { contains: 'test' } },
                    ],
                },
            })
        )
    })

    it('should merge search with existing where clause', async () => {
        mockModel.findMany.mockResolvedValue([])
        mockModel.count.mockResolvedValue(0)

        await paginate(
            mockModel,
            { search: 'test', searchFields: ['email'] },
            { where: { role: 'ADMIN' } }
        )

        expect(mockModel.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    role: 'ADMIN',
                    OR: [{ email: { contains: 'test' } }],
                },
            })
        )
    })

    it('should throw ApiError if model call fails', async () => {
        mockModel.findMany.mockRejectedValue(new Error('DB Error'))

        await expect(paginate(mockModel)).rejects.toThrow(ApiError)
        await expect(paginate(mockModel)).rejects.toMatchObject({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: expect.stringContaining('Pagination failed: DB Error'),
        })
    })
})
