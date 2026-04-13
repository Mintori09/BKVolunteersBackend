import { CampaignFileType } from '@prisma/client'
import { prismaClient } from 'src/config'
import * as cloudinaryMediaService from 'src/services/media'
import * as mediaRepository from '../media.repository'
import * as mediaService from '../media.service'

jest.mock('src/config', () => ({
    prismaClient: {
        $transaction: jest.fn(),
    },
}))

jest.mock('src/services/media', () => ({
    uploadMediaFile: jest.fn(),
    deleteMediaFile: jest.fn(),
}))

jest.mock('../media.repository')

describe('media business service', () => {
    const file = {
        originalname: 'cover.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('binary'),
    } as Express.Multer.File

    const uploadedAsset = {
        publicId: 'bk-volunteers/campaigns/covers/campaign-1/cover-new',
        secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/cover.png',
        resourceType: 'image',
        folder: 'bk-volunteers/campaigns/covers/campaign-1',
        originalName: 'cover.png',
        bytes: 1024,
        format: 'png',
        width: 1200,
        height: 630,
    }

    beforeEach(() => {
        jest.clearAllMocks()
        ;(prismaClient.$transaction as jest.Mock).mockImplementation(
            async (callback: (tx: object) => Promise<unknown>) =>
                callback({ tx: true })
        )
    })

    it('creates a file record and campaign file link for campaign document uploads', async () => {
        ;(mediaRepository.getCampaignById as jest.Mock).mockResolvedValue({
            id: 'campaign-1',
        })
        ;(cloudinaryMediaService.uploadMediaFile as jest.Mock).mockResolvedValue(
            uploadedAsset
        )
        ;(mediaRepository.createFileRecord as jest.Mock).mockResolvedValue({
            id: 'file-1',
            storageKey: uploadedAsset.publicId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: BigInt(uploadedAsset.bytes),
            uploadedByStudentId: null,
            uploadedByManagerId: null,
            createdAt: new Date('2026-04-13T10:00:00.000Z'),
        })
        ;(mediaRepository.createCampaignFileLink as jest.Mock).mockResolvedValue({
            id: 'campaign-file-1',
            campaignId: 'campaign-1',
            phaseId: null,
            fileId: 'file-1',
            fileType: CampaignFileType.PLAN,
            isPublic: false,
        })

        const result = await mediaService.uploadMedia(file, {
            useCase: 'campaign-plan',
            campaignId: 'campaign-1',
        })

        expect(mediaRepository.createFileRecord).toHaveBeenCalled()
        expect(mediaRepository.createCampaignFileLink).toHaveBeenCalledWith(
            expect.objectContaining({
                campaignId: 'campaign-1',
                fileId: 'file-1',
                fileType: CampaignFileType.PLAN,
                isPublic: false,
            }),
            expect.anything()
        )
        expect(result).toEqual(
            expect.objectContaining({
                operation: 'created',
                file: expect.objectContaining({
                    id: 'file-1',
                    storageKey: uploadedAsset.publicId,
                    fileSize: 1024,
                }),
            })
        )
    })

    it('reuses the current file record when a singular business target already has a file', async () => {
        ;(mediaRepository.findCampaignCoverTarget as jest.Mock).mockResolvedValue({
            id: 'campaign-1',
            coverFileId: 'file-1',
            coverFile: {
                id: 'file-1',
                storageKey: 'bk-volunteers/campaigns/covers/campaign-1/cover-old',
                originalName: 'old-cover.png',
                mimeType: 'image/png',
                fileSize: BigInt(500),
                uploadedByStudentId: null,
                uploadedByManagerId: null,
                createdAt: new Date('2026-04-10T10:00:00.000Z'),
            },
        })
        ;(cloudinaryMediaService.uploadMediaFile as jest.Mock).mockResolvedValue(
            uploadedAsset
        )
        ;(mediaRepository.updateFileRecord as jest.Mock).mockResolvedValue({
            id: 'file-1',
            storageKey: uploadedAsset.publicId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: BigInt(uploadedAsset.bytes),
            uploadedByStudentId: null,
            uploadedByManagerId: null,
            createdAt: new Date('2026-04-10T10:00:00.000Z'),
        })
        ;(cloudinaryMediaService.deleteMediaFile as jest.Mock).mockResolvedValue({
            deleted: true,
            result: 'ok',
        })

        const result = await mediaService.uploadMedia(file, {
            useCase: 'campaign-cover',
            referenceId: 'campaign-1',
        })

        expect(mediaRepository.updateFileRecord).toHaveBeenCalledWith(
            'file-1',
            expect.objectContaining({
                storageKey: uploadedAsset.publicId,
            }),
            expect.anything()
        )
        expect(mediaRepository.createFileRecord).not.toHaveBeenCalled()
        expect(cloudinaryMediaService.deleteMediaFile).toHaveBeenCalledWith(
            expect.objectContaining({
                publicId:
                    'bk-volunteers/campaigns/covers/campaign-1/cover-old',
                resourceType: 'image',
            })
        )
        expect(result.operation).toBe('updated')
    })

    it('deletes the file record in database and then cleans up Cloudinary', async () => {
        ;(mediaRepository.getFileById as jest.Mock).mockResolvedValue({
            id: 'file-1',
            storageKey: uploadedAsset.publicId,
            originalName: file.originalname,
            mimeType: 'application/pdf',
            fileSize: BigInt(2048),
            uploadedByStudentId: null,
            uploadedByManagerId: 'manager-1',
            createdAt: new Date('2026-04-13T10:00:00.000Z'),
        })
        ;(mediaRepository.deleteFileRecord as jest.Mock).mockResolvedValue({
            id: 'file-1',
        })
        ;(cloudinaryMediaService.deleteMediaFile as jest.Mock).mockResolvedValue({
            publicId: uploadedAsset.publicId,
            resourceType: 'raw',
            deleted: true,
            result: 'ok',
        })

        const result = await mediaService.deleteMedia('file-1', {})

        expect(mediaRepository.deleteFileRecord).toHaveBeenCalledWith(
            'file-1',
            expect.anything()
        )
        expect(cloudinaryMediaService.deleteMediaFile).toHaveBeenCalledWith(
            expect.objectContaining({
                publicId: uploadedAsset.publicId,
                resourceType: 'raw',
                invalidate: true,
            })
        )
        expect(result).toEqual(
            expect.objectContaining({
                operation: 'deleted',
                file: expect.objectContaining({
                    id: 'file-1',
                    fileSize: 2048,
                }),
            })
        )
    })
})
