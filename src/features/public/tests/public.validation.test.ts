import { describe, expect, it } from '@jest/globals'
import {
    listPublicCampaignsSchema,
    publicCampaignSlugSchema,
} from '../public.validation'

describe('listPublicCampaignsSchema', () => {
    const schema = listPublicCampaignsSchema.query!

    it('accepts the full Sprint 1 filter set', () => {
        const result = schema.safeParse({
            page: '2',
            limit: '9',
            q: 'mua he xanh',
            organization_id: '5',
            module_type: 'event',
            status: 'ONGOING',
        })

        expect(result.success).toBe(true)
    })

    it('rejects invalid organization_id', () => {
        const result = schema.safeParse({
            organization_id: 'org-5',
        })

        expect(result.success).toBe(false)
    })

    it('rejects unsupported module_type', () => {
        const result = schema.safeParse({
            module_type: 'volunteer',
        })

        expect(result.success).toBe(false)
    })

    it('rejects unsupported status', () => {
        const result = schema.safeParse({
            status: 'DRAFT',
        })

        expect(result.success).toBe(false)
    })
})

describe('publicCampaignSlugSchema', () => {
    const schema = publicCampaignSlugSchema.params!

    it('accepts a non-empty slug', () => {
        const result = schema.safeParse({ slug: 'mua-he-xanh-2026' })
        expect(result.success).toBe(true)
    })

    it('rejects an empty slug', () => {
        const result = schema.safeParse({ slug: '' })
        expect(result.success).toBe(false)
    })
})
