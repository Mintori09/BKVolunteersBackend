import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { uploadSingleFile } from 'src/common/middleware/uploadSingleFile'
import * as mediaController from './media.controller'
import {
    deleteMediaSchema,
    replaceMediaSchema,
    uploadMediaSchema,
} from './media.validation'

const mediaRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Media
 *   description: Media upload and deletion via Cloudinary
 */

/**
 * @openapi
 * /media:
 *   post:
 *     summary: Upload one file to Cloudinary and persist it into the File table
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - useCase
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               useCase:
 *                 type: string
 *                 example: campaign-cover
 *               referenceId:
 *                 type: string
 *                 example: d4fcbb7d-7f35-4a16-8a28-577894af2b6f
 *               campaignId:
 *                 type: string
 *               phaseId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               uploadedByStudentId:
 *                 type: string
 *               uploadedByManagerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad Request
 *       415:
 *         description: Unsupported Media Type
 */
mediaRouter.post(
    '/',
    uploadSingleFile('file'),
    validate(uploadMediaSchema),
    mediaController.handleUploadMedia
)

/**
 * @openapi
 * /media/{id}:
 *   put:
 *     summary: Replace an existing File record with a new upload
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - useCase
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               useCase:
 *                 type: string
 *                 example: campaign-cover
 *               referenceId:
 *                 type: string
 *               campaignId:
 *                 type: string
 *               phaseId:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               uploadedByStudentId:
 *                 type: string
 *               uploadedByManagerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
mediaRouter.put(
    '/:id',
    uploadSingleFile('file'),
    validate(replaceMediaSchema),
    mediaController.handleReplaceMedia
)

/**
 * @openapi
 * /media/{id}:
 *   delete:
 *     summary: Delete a File record in database and cleanup its Cloudinary asset
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invalidate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 */
mediaRouter.delete(
    '/:id',
    validate(deleteMediaSchema),
    mediaController.handleDeleteMedia
)

export default mediaRouter
