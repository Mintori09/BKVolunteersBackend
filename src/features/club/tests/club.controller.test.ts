import express from 'express'
import request from 'supertest'
import * as clubController from '../club.controller' // Điều chỉnh path cho đúng
import * as clubService from '../club.service' // Điều chỉnh path
import { HttpStatus } from 'src/common/constants'

// Mocking clubService
jest.mock('../club.service')

const app = express()
app.use(express.json())

// Định nghĩa các route để test
app.post('/clubs', clubController.createClub)
app.put('/clubs/:id', clubController.updateClub)
app.delete('/clubs/:id', clubController.deleteClub)
app.get('/clubs', clubController.getAllClubs)
app.get('/clubs/:id', clubController.getClubById)

describe('Club Controller', () => {
    const mockClub = { id: '1', name: 'CLB Guitar', facultyId: 1 }

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /clubs', () => {
        it('nên tạo CLB mới và trả về status 201', async () => {
            ;(clubService.createClub as jest.Mock).mockResolvedValue(mockClub)

            const res = await request(app)
                .post('/clubs')
                .send({ name: 'CLB Guitar', facultyId: 1 })

            expect(res.status).toBe(HttpStatus.CREATED)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toEqual(mockClub)
            expect(clubService.createClub).toHaveBeenCalledWith({
                name: 'CLB Guitar',
                facultyId: 1,
            })
        })
    })

    describe('PUT /clubs/:id', () => {
        it('nên cập nhật CLB thành công', async () => {
            const updatedClub = { ...mockClub, name: 'CLB Guitar Updated' }
            ;(clubService.updateClub as jest.Mock).mockResolvedValue(
                updatedClub
            )

            const res = await request(app)
                .put('/clubs/1')
                .send({ name: 'CLB Guitar Updated' })

            expect(res.status).toBe(HttpStatus.OK)
            expect(res.body.message).toBe('Cập nhật CLB thành công')
            expect(clubService.updateClub).toHaveBeenCalledWith('1', {
                name: 'CLB Guitar Updated',
            })
        })
    })

    describe('DELETE /clubs/:id', () => {
        it('nên xóa CLB và trả về null trong data', async () => {
            ;(clubService.deleteClub as jest.Mock).mockResolvedValue(undefined)

            const res = await request(app).delete('/clubs/1')

            expect(res.status).toBe(HttpStatus.OK)
            expect(res.body.message).toBe('Xóa CLB thành công')
            expect(clubService.deleteClub).toHaveBeenCalledWith('1')
        })
    })

    describe('GET /clubs', () => {
        it('nên lấy danh sách CLB với các query params', async () => {
            const mockClubs = { items: [mockClub], total: 1 }
            ;(clubService.getAllClubs as jest.Mock).mockResolvedValue(mockClubs)

            const res = await request(app).get('/clubs').query({
                page: '1',
                limit: '10',
                facultyId: '1',
                search: 'Guitar',
            })

            expect(res.status).toBe(HttpStatus.OK)
            expect(clubService.getAllClubs).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                facultyId: 1,
                search: 'Guitar',
            })
            expect(res.body.data).toEqual(mockClubs)
        })
    })

    describe('GET /clubs/:id', () => {
        it('nên lấy thông tin chi tiết CLB theo ID', async () => {
            ;(clubService.getClubById as jest.Mock).mockResolvedValue(mockClub)

            const res = await request(app).get('/clubs/1')

            expect(res.status).toBe(HttpStatus.OK)
            expect(res.body.data).toEqual(mockClub)
            expect(clubService.getClubById).toHaveBeenCalledWith('1')
        })
    })
})
