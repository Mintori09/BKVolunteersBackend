import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as uploadService from '../upload.service'
import * as uploadController from '../upload.controller'
import fs from 'fs'

jest.mock('../upload.service')
jest.mock('src/utils/ApiResponse')
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(),
}))

describe('Upload Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = { params: {}, file: null, body: {} }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendFile: jest.fn(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleUploadImage', () => {
        it('should throw BAD_REQUEST if no file', async () => {
            req.file = undefined

            await uploadController.handleUploadImage(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should upload image successfully', async () => {
            req.file = { filename: 'test.jpg', originalname: 'test.jpg', mimetype: 'image/jpeg', size: 1024 } as any
            const mockResult = { url: '/files/images/test.jpg', filename: 'test.jpg' }
            ;(uploadService.buildUploadResponse as jest.Mock).mockReturnValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await uploadController.handleUploadImage(req, res, next)

            expect(uploadService.buildUploadResponse).toHaveBeenCalledWith(req.file, 'image')
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })
    })

    describe('handleUploadDocument', () => {
        it('should throw BAD_REQUEST if no file', async () => {
            req.file = undefined

            await uploadController.handleUploadDocument(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should upload document successfully', async () => {
            req.file = { filename: 'test.pdf', originalname: 'test.pdf', mimetype: 'application/pdf', size: 2048 } as any
            const mockResult = { url: '/files/documents/test.pdf', filename: 'test.pdf' }
            ;(uploadService.buildUploadResponse as jest.Mock).mockReturnValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await uploadController.handleUploadDocument(req, res, next)

            expect(uploadService.buildUploadResponse).toHaveBeenCalledWith(req.file, 'document')
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })
    })

    describe('handleServeImage', () => {
        it('should throw BAD_REQUEST if no filename', async () => {
            req.params = {}

            await uploadController.handleServeImage(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if filename contains path traversal', async () => {
            req.params = { filename: '../etc/passwd' }

            await uploadController.handleServeImage(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should throw NOT_FOUND if file does not exist', async () => {
            req.params = { filename: 'missing.jpg' }
            ;(uploadService.getFilePath as jest.Mock).mockReturnValue('/uploads/images/missing.jpg')
            ;(fs.existsSync as jest.Mock).mockReturnValue(false)

            await uploadController.handleServeImage(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.NOT_FOUND)
        })

        it('should serve image file successfully', async () => {
            req.params = { filename: 'image.jpg' }
            ;(uploadService.getFilePath as jest.Mock).mockReturnValue('/uploads/images/image.jpg')
            ;(fs.existsSync as jest.Mock).mockReturnValue(true)

            await uploadController.handleServeImage(req, res, next)

            expect(res.sendFile).toHaveBeenCalledWith('/uploads/images/image.jpg')
        })
    })

    describe('handleServeDocument', () => {
        it('should throw BAD_REQUEST if no filename', async () => {
            req.params = {}

            await uploadController.handleServeDocument(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if filename contains path traversal', async () => {
            req.params = { filename: '../../secret.txt' }

            await uploadController.handleServeDocument(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should throw NOT_FOUND if file does not exist', async () => {
            req.params = { filename: 'missing.pdf' }
            ;(uploadService.getFilePath as jest.Mock).mockReturnValue('/uploads/documents/missing.pdf')
            ;(fs.existsSync as jest.Mock).mockReturnValue(false)

            await uploadController.handleServeDocument(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.NOT_FOUND)
        })

        it('should serve document file successfully', async () => {
            req.params = { filename: 'doc.pdf' }
            ;(uploadService.getFilePath as jest.Mock).mockReturnValue('/uploads/documents/doc.pdf')
            ;(fs.existsSync as jest.Mock).mockReturnValue(true)

            await uploadController.handleServeDocument(req, res, next)

            expect(res.sendFile).toHaveBeenCalledWith('/uploads/documents/doc.pdf')
        })
    })
})