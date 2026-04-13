import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    deleteMediaFile,
    uploadMediaFile,
} from '../cloudinaryMedia.service'

jest.mock('src/config', () => ({
    config: {
        cloudinary: {
            cloud_name: 'demo',
            api_key: '123456',
            api_secret: 'secret',
            base_folder: 'bk-volunteers',
            is_configured: true,
        },
    },
}))

jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload_stream: jest.fn(),
            destroy: jest.fn(),
        },
    },
}))

describe('cloudinary media service', () => {
    const file = {
        originalname: 'cover-image.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('file-content'),
    } as Express.Multer.File

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uploads a file with business folder mapping', async () => {
        ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
            (
                options: { folder: string; public_id: string },
                callback: (
                    error: unknown,
                    result: {
                        public_id: string
                        secure_url: string
                        resource_type: string
                        bytes: number
                        format: string
                        width: number
                        height: number
                    }
                ) => void
            ) => ({
                end: (buffer: Buffer) =>
                    callback(null, {
                        public_id: `${options.folder}/${options.public_id}`,
                        secure_url:
                            'https://res.cloudinary.com/demo/image/upload/v1/test.png',
                        resource_type: 'image',
                        bytes: buffer.length,
                        format: 'png',
                        width: 1280,
                        height: 720,
                    }),
            })
        )

        const result = await uploadMediaFile({
            file,
            useCase: 'campaign-cover',
            referenceId: 'Campaign_123',
        })

        expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
            expect.objectContaining({
                folder: 'bk-volunteers/campaigns/covers/campaign_123',
                resource_type: 'auto',
            }),
            expect.any(Function)
        )
        expect(result).toEqual(
            expect.objectContaining({
                folder: 'bk-volunteers/campaigns/covers/campaign_123',
                resourceType: 'image',
                originalName: 'cover-image.png',
            })
        )
    })

    it('rejects a file with unsupported mime type for the use case', async () => {
        const invalidFile = {
            ...file,
            mimetype: 'application/pdf',
        } as Express.Multer.File

        await expect(
            uploadMediaFile({
                file: invalidFile,
                useCase: 'campaign-cover',
            })
        ).rejects.toThrow(
            new ApiError(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                'File type application/pdf is not allowed for campaign-cover'
            )
        )

        expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled()
    })

    it('deletes a file with the provided resource type', async () => {
        ;(cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
            result: 'ok',
        })

        const result = await deleteMediaFile({
            publicId: 'bk-volunteers/campaigns/covers/campaign_123/cover',
            resourceType: 'image',
        })

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
            'bk-volunteers/campaigns/covers/campaign_123/cover',
            {
                resource_type: 'image',
                invalidate: true,
            }
        )
        expect(result).toEqual({
            publicId: 'bk-volunteers/campaigns/covers/campaign_123/cover',
            resourceType: 'image',
            deleted: true,
            result: 'ok',
        })
    })
})
