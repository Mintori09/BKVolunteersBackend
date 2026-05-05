export interface UploadOutput {
    url: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    path: string
}

export type UploadType = 'image' | 'document'
