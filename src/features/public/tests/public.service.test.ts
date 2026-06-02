import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { HttpStatus } from 'src/common/constants'
import * as publicRepository from '../public.repository'
import * as publicService from '../public.service'

jest.mock('../public.repository')

const mockCampaign = {
    id: 101n,
    slug: 'mua-he-xanh-2026',
    title: 'Mua he xanh 2026',
    summary: 'Tinh nguyen he',
    description: 'Mo ta chi tiet',
    coverImageUrl: 'https://cdn.example.com/campaign.jpg',
    beneficiary: 'Hoc sinh vung cao',
    scopeType: 'SCHOOL',
    startAt: new Date('2026-05-01T00:00:00.000Z'),
    endAt: new Date('2026-06-01T00:00:00.000Z'),
    status: 'ONGOING',
    publishedAt: new Date('2026-04-25T00:00:00.000Z'),
    organization: {
        id: 5n,
        code: 'CLB-ITV',
        name: 'CLB Tinh nguyen CNTT',
        type: 'club',
        logoUrl: 'https://cdn.example.com/org.png',
    },
    modules: [
        {
            id: 11n,
            type: 'FUNDRAISING',
            title: 'Gay quy hoc bong',
            description: 'Ung ho hoc bong',
            status: 'OPEN',
            startAt: new Date('2026-05-01T00:00:00.000Z'),
            endAt: new Date('2026-05-30T00:00:00.000Z'),
            settingsJson: { target_amount: 5000000 },
            moneyDonations: [{ amount: 1500000 }],
            itemTargets: [],
            eventRegistrations: [],
        },
        {
            id: 12n,
            type: 'EVENT',
            title: 'Ra quan tinh nguyen',
            description: 'Su kien ra quan',
            status: 'OPEN',
            startAt: new Date('2026-05-01T00:00:00.000Z'),
            endAt: new Date('2026-05-30T00:00:00.000Z'),
            settingsJson: { quota: 100 },
            moneyDonations: [],
            itemTargets: [],
            eventRegistrations: [{ id: 1n }, { id: 2n }],
        },
    ],
}

describe('public.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('listCampaigns', () => {
        it('serializes organization, module_types and progress for public cards', async () => {
            ;(publicRepository.findPublicCampaigns as jest.Mock).mockResolvedValue([
                [mockCampaign],
                1,
            ])

            const result = await publicService.listCampaigns({
                page: 1,
                limit: 9,
                organization_id: '5',
                module_type: 'fundraising',
                status: 'ONGOING',
            })

            expect(publicRepository.findPublicCampaigns).toHaveBeenCalledWith({
                page: 1,
                limit: 9,
                organization_id: '5',
                module_type: 'fundraising',
                status: 'ONGOING',
            })
            expect(result.items).toHaveLength(1)
            expect(result.items[0]).toMatchObject({
                id: 101,
                slug: 'mua-he-xanh-2026',
                organization: {
                    id: 5,
                    code: 'CLB-ITV',
                    name: 'CLB Tinh nguyen CNTT',
                },
                module_types: ['fundraising', 'event'],
                progress: {
                    percent: 16,
                },
            })
            expect(result.pagination.totalPages).toBe(1)
        })
    })

    describe('getCampaignBySlug', () => {
        it('returns modules with settings, progress and cta', async () => {
            ;(
                publicRepository.findPublicCampaignBySlug as jest.Mock
            ).mockResolvedValue(mockCampaign)

            const result =
                await publicService.getCampaignBySlug('mua-he-xanh-2026')

            expect(result.modules[0]).toMatchObject({
                id: 11,
                type: 'fundraising',
                settings: { target_amount: 5000000 },
                progress: {
                    type: 'fundraising',
                    current: 1500000,
                    target: 5000000,
                    percent: 30,
                },
                cta: {
                    enabled: false,
                    label: 'Theo dõi gây quỹ',
                    action: null,
                },
            })
            expect(result.modules[1]).toMatchObject({
                id: 12,
                type: 'event',
                cta: {
                    enabled: true,
                    label: 'Đăng ký sự kiện',
                    action: 'event_register',
                },
            })
        })

        it('rejects non-public campaigns', async () => {
            ;(
                publicRepository.findPublicCampaignBySlug as jest.Mock
            ).mockResolvedValue({
                ...mockCampaign,
                status: 'DRAFT',
            })

            await expect(
                publicService.getCampaignBySlug('mua-he-xanh-2026')
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })
    })

    describe('verifyCertificate', () => {
        it('returns valid=false for certificates not yet issued', async () => {
            ;(publicRepository.findCertificateByNumber as jest.Mock).mockResolvedValue({
                id: 9001n,
                certificateNo: 'CERT-9001',
                status: 'PENDING',
                issuedAt: null,
                revokedAt: null,
                studentId: 42n,
                campaignId: 101n,
                student: { fullName: 'Nguyen Van A' },
                campaign: {
                    title: 'Mua he xanh 2026',
                    organization: { name: 'CLB Tinh nguyen CNTT' },
                },
            })

            const result = await publicService.verifyCertificate('CERT-9001')

            expect(result).toMatchObject({
                valid: false,
                certificate: {
                    id: 9001,
                    certificate_no: 'CERT-9001',
                    status: 'PENDING',
                },
            })
        })

        it('returns valid=true only for issued certificates that are not revoked', async () => {
            ;(publicRepository.findCertificateByNumber as jest.Mock).mockResolvedValue({
                id: 9002n,
                certificateNo: 'CERT-9002',
                status: 'READY',
                issuedAt: new Date('2026-05-01T00:00:00.000Z'),
                revokedAt: null,
                studentId: 42n,
                campaignId: 101n,
                student: { fullName: 'Nguyen Van A' },
                campaign: {
                    title: 'Mua he xanh 2026',
                    organization: { name: 'CLB Tinh nguyen CNTT' },
                },
            })

            const result = await publicService.verifyCertificate('CERT-9002')

            expect(result).toMatchObject({
                valid: true,
                certificate: {
                    id: 9002,
                    certificate_no: 'CERT-9002',
                    status: 'READY',
                },
            })
        })
    })
})
