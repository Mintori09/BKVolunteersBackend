import { Router, Request, Response, NextFunction } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import {
    uploadImageMiddleware,
    uploadDocumentMiddleware,
} from 'src/common/middleware/upload'
import * as uploadController from './upload.controller'
import multer from 'multer'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

const uploadRouter = Router()
const filesRouter = Router()

const handleMulterError = (
    err: Error,
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            const isImage = req.path.includes('/image')
            const maxSize = isImage ? '5MB' : '10MB'
            return next(
                new ApiError(
                    HttpStatus.BAD_REQUEST,
                    `Kích thước file không được vượt quá ${maxSize}`
                )
            )
        }
        return next(new ApiError(HttpStatus.BAD_REQUEST, err.message))
    }
    if (err.message.includes('Chỉ chấp nhận')) {
        return next(new ApiError(HttpStatus.BAD_REQUEST, err.message))
    }
    next(err)
}

/**
 * @openapi
 * tags:
 *   name: Upload
 *   description: File upload management
 */

/**
 * @openapi
 * /upload/image:
 *   post:
 *     summary: Upload image file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, WEBP), max 5MB
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
uploadRouter.post(
    '/image',
    isAuth,
    uploadImageMiddleware.single('file'),
    handleMulterError,
    uploadController.handleUploadImage
)

/**
 * @openapi
 * /upload/document:
 *   post:
 *     summary: Upload document file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (PDF, DOC, DOCX, XLS, XLSX), max 10MB
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
uploadRouter.post(
    '/document',
    isAuth,
    uploadDocumentMiddleware.single('file'),
    handleMulterError,
    uploadController.handleUploadDocument
)

/**
 * @openapi
 * /files/images/{filename}:
 *   get:
 *     summary: Serve image file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Image filename
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
filesRouter.get('/images/:filename', isAuth, uploadController.handleServeImage)

/**
 * @openapi
 * /files/documents/{filename}:
 *   get:
 *     summary: Serve document file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Document filename
 *     responses:
 *       200:
 *         description: Document file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/msword:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.ms-excel:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
filesRouter.get(
    '/documents/:filename',
    isAuth,
    uploadController.handleServeDocument
)

export { uploadRouter, filesRouter }
