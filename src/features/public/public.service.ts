import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as publicRepository from './public.repository'
import {
    PublicCampaignDetailOutput,
    PublicCampaignListItemOutput,
    PublicCampaignListOutput,
    PublicCampaignListQuery,
    PublicCertificateVerifyOutput,
} from './types'

const serializeCampaign = (item: Awaited<
    ReturnType<typeof publicRepository.findPublicCampaignBySlug>
> extends infer T
    ? Exclude<T, null>
    : never): PublicCampaignListItemOutput => ({
    id: serializeId(item.id)!,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    cover_image_url: item.coverImageUrl,
    beneficiary: item.beneficiary,
    scope_type: item.scopeType,
    start_at: item.startAt,
    end_at: item.endAt,
    status: item.status,
})

export const listCampaigns = async (
    query: PublicCampaignListQuery
): Promise<PublicCampaignListOutput> => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const [items, total] = await publicRepository.findPublicCampaigns(page, limit)

    return serializePagination(
        items.map((item) => serializeCampaign(item)),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

export const getCampaignBySlug = async (
    slug: string
): Promise<PublicCampaignDetailOutput> => {
    const item = await publicRepository.findPublicCampaignBySlug(slug)

    if (!item || !['PUBLISHED', 'ONGOING'].includes(item.status)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    return {
        ...serializeCampaign(item),
        description: item.description,
        modules: [],
    }
}

export const verifyCertificate = async (
    certificateNo: string
): Promise<PublicCertificateVerifyOutput> => {
    const certificate = await publicRepository.findCertificateByNumber(
        certificateNo
    )

    if (!certificate) {
        return { valid: false, certificate: null }
    }

    return {
        valid: certificate.status !== 'REVOKED',
        certificate: {
            id: serializeId(certificate.id)!,
            certificate_no: certificate.certificateNo,
            status: certificate.status,
            issued_at: certificate.issuedAt,
            revoked_at: certificate.revokedAt,
            student_id: serializeId(certificate.studentId)!,
            campaign_id: serializeId(certificate.campaignId)!,
        },
    }
}
