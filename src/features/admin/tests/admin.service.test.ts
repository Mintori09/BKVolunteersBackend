import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as certificatesService from 'src/features/certificates/certificates.service'
import * as adminRepository from '../admin.repository'
import * as adminService from '../admin.service'

jest.mock('../admin.repository')
jest.mock('src/features/certificates/certificates.service')

describe('admin.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('applies audit log filters including date range', async () => {
        ;(adminRepository.findAuditLogs as jest.Mock).mockResolvedValue([
            1,
            [
                {
                    id: 1001n,
                    actorType: 'OPERATOR',
                    actorId: 9n,
                    action: 'CERTIFICATE_RENDERED',
                    entityType: 'CERTIFICATE',
                    entityId: 3001n,
                    beforeJson: null,
                    afterJson: { status: 'READY' },
                    ipAddress: '127.0.0.1',
                    createdAt: new Date('2026-05-22T08:00:00.000Z'),
                },
            ],
        ])

        const result = await adminService.listAuditLogs({
            page: 2,
            limit: 10,
            action: 'CERTIFICATE_RENDERED',
            from: '2026-05-20T00:00:00.000Z',
            to: '2026-05-22T23:59:59.999Z',
        })

        expect(adminRepository.findAuditLogs).toHaveBeenCalledWith({
            page: 2,
            limit: 10,
            where: {
                action: 'CERTIFICATE_RENDERED',
                createdAt: {
                    gte: new Date('2026-05-20T00:00:00.000Z'),
                    lte: new Date('2026-05-22T23:59:59.999Z'),
                },
            },
        })
        expect(result.items[0]).toMatchObject({
            id: 1001,
            actor_type: 'OPERATOR',
            actor_id: 9,
            entity_id: 3001,
        })
    })

    it('delegates due background-job execution to certificates service', async () => {
        ;(certificatesService.processDueBackgroundJobs as jest.Mock).mockResolvedValue({
            queued: 2,
            processed_count: 2,
            failed_count: 0,
            items: [],
            failed: [],
        })

        const result = await adminService.runBackgroundJobs({
            type: 'RENDER_CERTIFICATE',
            limit: 5,
        })

        expect(certificatesService.processDueBackgroundJobs).toHaveBeenCalledWith({
            type: 'RENDER_CERTIFICATE',
            limit: 5,
        })
        expect(result).toMatchObject({
            queued: 2,
            processed_count: 2,
        })
    })

    it('delegates background-job retry to certificates service', async () => {
        ;(certificatesService.retryBackgroundJob as jest.Mock).mockResolvedValue({
            id: 501,
            status: 'COMPLETED',
        })

        const result = await adminService.retryBackgroundJob('501')

        expect(certificatesService.retryBackgroundJob).toHaveBeenCalledWith('501')
        expect(result).toMatchObject({
            id: 501,
            status: 'COMPLETED',
        })
    })
})
