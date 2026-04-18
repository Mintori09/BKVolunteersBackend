import * as clubService from '../club.service' // Điều chỉnh path
import * as clubRepo from '../club.repository' // Điều chỉnh path
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

// Mock repository
jest.mock('../club.repository')

describe('Club Service', () => {
    const mockClub = { id: 'club-1', name: 'CLB IT', leaderId: 'user-1' }

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createClub', () => {
        it('nên tạo CLB thành công khi leaderId hợp lệ', async () => {
            const input = { name: 'CLB IT', leaderId: 'user-1' }

            // Giả lập tìm thấy leader
            ;(clubRepo.findById as jest.Mock).mockResolvedValue({
                id: 'user-1',
            })
            ;(clubRepo.create as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubService.createClub(input)

            expect(clubRepo.findById).toHaveBeenCalledWith('user-1')
            expect(clubRepo.create).toHaveBeenCalledWith(input)
            expect(result).toEqual(mockClub)
        })

        it('nên quăng lỗi ApiError nếu không tìm thấy leaderId', async () => {
            const input = { name: 'CLB IT', leaderId: 'non-existent' }
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(clubService.createClub(input)).rejects.toThrow(
                ApiError
            )
            await expect(clubService.createClub(input)).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
                message: 'Không tìm thấy người dùng làm trưởng CLB',
            })
        })
    })

    describe('updateClub', () => {
        it('nên cập nhật thành công nếu CLB tồn tại', async () => {
            const updateData = { name: 'CLB Updated' }
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(mockClub)
            ;(clubRepo.updateById as jest.Mock).mockResolvedValue({
                ...mockClub,
                ...updateData,
            })

            const result = await clubService.updateClub('club-1', updateData)

            expect(result.name).toBe('CLB Updated')
            expect(clubRepo.updateById).toHaveBeenCalledWith(
                'club-1',
                updateData
            )
        })

        it('nên quăng lỗi nếu CLB cần cập nhật không tồn tại', async () => {
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(clubService.updateClub('999', {})).rejects.toThrow(
                'Không tìm thấy CLB'
            )
        })
    })

    describe('deleteClub', () => {
        it('nên gọi soft delete nếu CLB tồn tại', async () => {
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(mockClub)
            ;(clubRepo.softDeleteById as jest.Mock).mockResolvedValue(true)

            await clubService.deleteClub('club-1')

            expect(clubRepo.softDeleteById).toHaveBeenCalledWith('club-1')
        })

        it('nên quăng lỗi nếu xóa CLB không tồn tại', async () => {
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(clubService.deleteClub('999')).rejects.toThrow(
                ApiError
            )
        })
    })

    describe('getAllClubs', () => {
        it('nên gọi findMany với đúng các tham số filter', async () => {
            const query = { page: 1, limit: 10, search: 'IT' }
            ;(clubRepo.findMany as jest.Mock).mockResolvedValue([mockClub])

            const result = await clubService.getAllClubs(query)

            expect(clubRepo.findMany).toHaveBeenCalledWith(query)
            expect(result).toEqual([mockClub])
        })
    })

    describe('getClubById', () => {
        it('nên trả về thông tin CLB nếu tìm thấy', async () => {
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubService.getClubById('club-1')

            expect(result).toEqual(mockClub)
        })

        it('nên quăng lỗi nếu không tìm thấy ID', async () => {
            ;(clubRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(clubService.getClubById('unknown')).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy CLB')
            )
        })
    })
})
