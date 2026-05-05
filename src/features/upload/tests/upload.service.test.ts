import * as uploadService from '../upload.service'

jest.mock('src/config', () => ({
    uploadConfig: {
        image: {
            storagePath: '/uploads/images',
            urlPrefix: '/files/images',
        },
        document: {
            storagePath: '/uploads/documents',
            urlPrefix: '/files/documents',
        },
    },
    getAbsoluteStoragePath: (path: string) => `/absolute${path}`,
}))

describe('Upload Service', () => {
    describe('buildUploadResponse', () => {
        const mockFile: Express.Multer.File = {
            fieldname: 'file',
            originalname: 'test-image.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: '/uploads/images',
            filename: 'abc123.jpg',
            path: '/uploads/images/abc123.jpg',
            size: 1024,
            stream: {} as any,
            buffer: Buffer.from(''),
        }

        it('should build response for image upload', () => {
            const result = uploadService.buildUploadResponse(mockFile, 'image')

            expect(result).toEqual({
                url: '/files/images/abc123.jpg',
                filename: 'abc123.jpg',
                originalName: 'test-image.jpg',
                mimeType: 'image/jpeg',
                size: 1024,
                path: '/uploads/images/abc123.jpg',
            })
        })

        it('should build response for document upload', () => {
            const docFile: Express.Multer.File = {
                ...mockFile,
                originalname: 'test-doc.pdf',
                mimetype: 'application/pdf',
                filename: 'def456.pdf',
            }

            const result = uploadService.buildUploadResponse(docFile, 'document')

            expect(result).toEqual({
                url: '/files/documents/def456.pdf',
                filename: 'def456.pdf',
                originalName: 'test-doc.pdf',
                mimeType: 'application/pdf',
                size: 1024,
                path: '/uploads/documents/def456.pdf',
            })
        })
    })

    describe('getFilePath', () => {
        it('should return absolute path for image file', () => {
            const result = uploadService.getFilePath('image.jpg', 'image')

            expect(result).toBe('/absolute/uploads/images/image.jpg')
        })

        it('should return absolute path for document file', () => {
            const result = uploadService.getFilePath('doc.pdf', 'document')

            expect(result).toBe('/absolute/uploads/documents/doc.pdf')
        })
    })
})