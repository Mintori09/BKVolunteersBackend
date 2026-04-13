import {
    type MediaUseCase,
} from 'src/services/media'

export interface MediaUploadPayload {
    useCase: MediaUseCase
    referenceId?: string
    campaignId?: string
    phaseId?: string
    isPublic?: boolean | string
    uploadedByStudentId?: string
    uploadedByManagerId?: string
}

export interface MediaReplacePayload extends MediaUploadPayload {}

export interface MediaDeletePayload {
    invalidate?: boolean | string
}

export interface MediaRouteParams {
    id: string
}
