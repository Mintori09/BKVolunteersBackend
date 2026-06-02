import { HttpStatus } from 'src/common/constants'
import * as certificatesRepository from '../certificates.repository'
import { renderCertificatePdf } from '../pdf-renderer'
import * as certificatesService from '../certificates.service'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        email: {
            smtp: {
                host: 'localhost',
                port: '1025',
                auth: {
                    username: 'test_user',
                    password: 'test_password',
                },
            },
        },
    },
}))

jest.mock('../certificates.repository')
jest.mock('../pdf-renderer', () => ({
    renderCertificatePdf: jest.fn(() =>
        Buffer.from('%PDF-1.4 mock certificate')
    ),
}))

describe('certificates.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(renderCertificatePdf as jest.Mock).mockReturnValue(
            Buffer.from('%PDF-1.4 mock certificate')
        )
    })

    describe('createTemplate', () => {
        it('should reject non-operator principal', async () => {
            await expect(
                certificatesService.createTemplate(
                    { name: 'Template A' },
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })
    })

    describe('generateCertificates', () => {
        it('should reject missing campaign', async () => {
            ;(certificatesRepository.findCampaignById as jest.Mock).mockResolvedValue(
                null
            )
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 1n,
                status: 'ACTIVE',
            })

            await expect(
                certificatesService.generateCertificates(
                    '7',
                    { template_id: '1' },
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })

        it('should skip registrations with existing active certificate', async () => {
            ;(certificatesRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 7n,
                title: 'Campaign',
                deletedAt: null,
            })
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 1n,
                status: 'ACTIVE',
            })
            ;(
                certificatesRepository.findEligibleRegistrations as jest.Mock
            ).mockResolvedValue([
                {
                    moduleId: 11n,
                    studentId: 42n,
                    student: {
                        fullName: 'Nguyen Van A',
                        studentCode: '2012345',
                    },
                },
                {
                    moduleId: 11n,
                    studentId: 43n,
                    student: {
                        fullName: 'Tran Thi B',
                        studentCode: '2012346',
                    },
                },
            ])
            ;(certificatesRepository.findExistingCertificate as jest.Mock)
                .mockResolvedValueOnce({ id: 2000n })
                .mockResolvedValueOnce(null)
            ;(certificatesRepository.createCertificate as jest.Mock).mockResolvedValue({
                id: 3001n,
                certificateNo: 'CERT-7-43',
                campaignId: 7n,
                moduleId: 11n,
                studentId: 43n,
                templateId: 1n,
                status: 'PENDING',
                snapshotJson: {},
                fileUrl: null,
                fileHash: null,
                issuedAt: null,
                revokedAt: null,
                revokedBy: null,
                revokeReason: null,
                replacementCertificateId: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            })
            ;(certificatesRepository.createRenderJob as jest.Mock).mockResolvedValue({})

            const result = await certificatesService.generateCertificates(
                '7',
                { template_id: '1' },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(certificatesRepository.createCertificate).toHaveBeenCalledTimes(1)
            expect(certificatesRepository.createRenderJob).toHaveBeenCalledWith(3001n)
            expect(result).toMatchObject({
                created_count: 1,
                items: [{ id: 3001, student_id: 43 }],
            })
            expect(certificatesRepository.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: 9n,
                    action: 'CERTIFICATE_GENERATED',
                    entityId: 3001n,
                })
            )
        })

        it('should support dry_run without creating certificates', async () => {
            ;(certificatesRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 7n,
                title: 'Campaign',
                deletedAt: null,
            })
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 1n,
                status: 'ACTIVE',
            })
            ;(
                certificatesRepository.findEligibleRegistrations as jest.Mock
            ).mockResolvedValue([
                {
                    moduleId: 11n,
                    studentId: 43n,
                    student: {
                        fullName: 'Tran Thi B',
                        studentCode: '2012346',
                    },
                },
            ])
            ;(certificatesRepository.findExistingCertificate as jest.Mock).mockResolvedValue(
                null
            )

            const result = await certificatesService.generateCertificates(
                '7',
                { template_id: '1', dry_run: true },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(certificatesRepository.createCertificate).not.toHaveBeenCalled()
            expect(certificatesRepository.createRenderJob).not.toHaveBeenCalled()
            expect(result).toMatchObject({
                dry_run: true,
                candidate_count: 1,
                created_count: 0,
                items: [{ certificate_no: 'CERT-7-43', student_id: 43 }],
            })
        })

        it('should reject inactive template', async () => {
            ;(certificatesRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 7n,
                title: 'Campaign',
                deletedAt: null,
            })
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 1n,
                status: 'INACTIVE',
            })

            await expect(
                certificatesService.generateCertificates(
                    '7',
                    { template_id: '1' },
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(certificatesRepository.createCertificate).not.toHaveBeenCalled()
        })
    })

    describe('revokeCertificate', () => {
        it('should update status and write audit log', async () => {
            const current = {
                id: 3001n,
                certificateNo: 'CERT-7-42',
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                templateId: 1n,
                status: 'READY',
                snapshotJson: {},
                fileUrl: '/api/v1/certificates/3001/download',
                fileHash: 'hash-1',
                issuedAt: new Date('2025-01-01T00:00:00.000Z'),
                revokedAt: null,
                revokedBy: null,
                revokeReason: null,
                replacementCertificateId: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            }
            ;(certificatesRepository.findCertificateById as jest.Mock).mockResolvedValue(
                current
            )
            ;(certificatesRepository.updateCertificate as jest.Mock).mockResolvedValue({
                ...current,
                status: 'REVOKED',
                revokedBy: 9n,
                revokeReason: 'Sai thong tin',
                revokedAt: new Date('2025-01-02T00:00:00.000Z'),
            })
            ;(certificatesRepository.createAuditLog as jest.Mock).mockResolvedValue({})

            const result = await certificatesService.revokeCertificate(
                '3001',
                { reason: 'Sai thong tin' },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(certificatesRepository.updateCertificate).toHaveBeenCalled()
            expect(certificatesRepository.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'CERTIFICATE_REVOKED',
                    entityId: 3001n,
                })
            )
            expect(result).toMatchObject({
                id: 3001,
                status: 'REVOKED',
                revoked_by: 9,
            })
        })
    })

    describe('updateTemplate', () => {
        it('should allow full update for unused template', async () => {
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 9001n,
                name: 'Old Template',
                type: 'VOLUNTEER',
                fileUrl: 'https://cdn.example.com/old.pdf',
                layoutJson: { version: 1 },
                status: 'ACTIVE',
                createdBy: 7n,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                _count: {
                    certificates: 0,
                },
            })
            ;(certificatesRepository.hasTemplateUsage as jest.Mock).mockResolvedValue(
                false
            )
            ;(certificatesRepository.updateTemplate as jest.Mock).mockResolvedValue({
                id: 9001n,
                name: 'New Template',
                type: 'VOLUNTEER_V2',
                fileUrl: 'https://cdn.example.com/new.pdf',
                layoutJson: { version: 2 },
                status: 'INACTIVE',
                createdBy: 7n,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                _count: {
                    certificates: 0,
                },
            })

            const result = await certificatesService.updateTemplate(
                '9001',
                {
                    name: 'New Template',
                    type: 'VOLUNTEER_V2',
                    file_url: 'https://cdn.example.com/new.pdf',
                    layout_json: { version: 2 },
                    status: 'INACTIVE',
                },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(certificatesRepository.updateTemplate).toHaveBeenCalledWith(
                9001n,
                {
                    name: 'New Template',
                    type: 'VOLUNTEER_V2',
                    fileUrl: 'https://cdn.example.com/new.pdf',
                    layoutJson: { version: 2 },
                    status: 'INACTIVE',
                }
            )
            expect(result).toMatchObject({
                id: 9001,
                name: 'New Template',
                status: 'INACTIVE',
                is_locked: false,
            })
        })

        it('should reject structural update for used template', async () => {
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 9002n,
                name: 'Locked Template',
                type: 'VOLUNTEER',
                fileUrl: 'https://cdn.example.com/current.pdf',
                layoutJson: { version: 1 },
                status: 'ACTIVE',
                createdBy: 7n,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                _count: {
                    certificates: 3,
                },
            })
            ;(certificatesRepository.hasTemplateUsage as jest.Mock).mockResolvedValue(
                true
            )

            await expect(
                certificatesService.updateTemplate(
                    '9002',
                    {
                        layout_json: { version: 2 },
                    },
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(certificatesRepository.updateTemplate).not.toHaveBeenCalled()
        })

        it('should allow name and status update for used template', async () => {
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 9003n,
                name: 'Used Template',
                type: 'VOLUNTEER',
                fileUrl: 'https://cdn.example.com/current.pdf',
                layoutJson: { version: 1 },
                status: 'ACTIVE',
                createdBy: 7n,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                _count: {
                    certificates: 1,
                },
            })
            ;(certificatesRepository.hasTemplateUsage as jest.Mock).mockResolvedValue(
                true
            )
            ;(certificatesRepository.updateTemplate as jest.Mock).mockResolvedValue({
                id: 9003n,
                name: 'Used Template v2',
                type: 'VOLUNTEER',
                fileUrl: 'https://cdn.example.com/current.pdf',
                layoutJson: { version: 1 },
                status: 'INACTIVE',
                createdBy: 7n,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-02T00:00:00.000Z'),
                _count: {
                    certificates: 1,
                },
            })

            const result = await certificatesService.updateTemplate(
                '9003',
                {
                    name: 'Used Template v2',
                    status: 'INACTIVE',
                },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(certificatesRepository.updateTemplate).toHaveBeenCalledWith(
                9003n,
                {
                    name: 'Used Template v2',
                    status: 'INACTIVE',
                }
            )
            expect(result).toMatchObject({
                id: 9003,
                name: 'Used Template v2',
                status: 'INACTIVE',
                is_locked: true,
            })
        })
    })

    describe('deleteTemplate', () => {
        it('should soft deactivate template', async () => {
            ;(certificatesRepository.findTemplateById as jest.Mock).mockResolvedValue({
                id: 9004n,
                name: 'Template To Deactivate',
                status: 'ACTIVE',
                _count: {
                    certificates: 0,
                },
            })
            ;(certificatesRepository.updateTemplate as jest.Mock).mockResolvedValue({
                id: 9004n,
                status: 'INACTIVE',
                _count: {
                    certificates: 0,
                },
            })

            await certificatesService.deleteTemplate('9004', {
                accountType: 'OPERATOR',
                userId: '9',
            })

            expect(certificatesRepository.updateTemplate).toHaveBeenCalledWith(
                9004n,
                { status: 'INACTIVE' }
            )
            expect(certificatesRepository.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'CERTIFICATE_TEMPLATE_DEACTIVATED',
                    entityType: 'certificate_template',
                    entityId: 9004n,
                })
            )
        })
    })

    describe('processBackgroundJob', () => {
        it('should render a pending certificate job and mark it completed', async () => {
            ;(certificatesRepository.findBackgroundJobById as jest.Mock).mockResolvedValue({
                id: 501n,
                type: 'RENDER_CERTIFICATE',
                status: 'PENDING',
                payloadJson: { certificate_id: 3001 },
            })
            ;(certificatesRepository.markBackgroundJobRunning as jest.Mock).mockResolvedValue(
                {}
            )
            ;(certificatesRepository.findCertificateById as jest.Mock)
                .mockResolvedValueOnce({
                    id: 3001n,
                    certificateNo: 'CERT-7-42',
                    campaignId: 7n,
                    moduleId: 11n,
                    studentId: 42n,
                    templateId: 1n,
                    status: 'PENDING',
                    snapshotJson: { campaign_title: 'Campaign' },
                    fileUrl: null,
                    fileHash: null,
                    issuedAt: null,
                    revokedAt: null,
                    revokedBy: null,
                    revokeReason: null,
                    replacementCertificateId: null,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    student: {
                        fullName: 'Nguyen Van A',
                        studentCode: '102210001',
                    },
                    template: {
                        name: 'Volunteer MVP Certificate',
                        layoutJson: {},
                        status: 'ACTIVE',
                    },
                    module: {
                        title: 'Tình nguyện viên sự kiện',
                    },
                    campaign: {
                        title: 'Campaign',
                    },
                })
                .mockResolvedValueOnce({
                    id: 3001n,
                    certificateNo: 'CERT-7-42',
                    campaignId: 7n,
                    moduleId: 11n,
                    studentId: 42n,
                    templateId: 1n,
                    status: 'PENDING',
                    snapshotJson: { campaign_title: 'Campaign' },
                    fileUrl: null,
                    fileHash: null,
                    issuedAt: null,
                    revokedAt: null,
                    revokedBy: null,
                    revokeReason: null,
                    replacementCertificateId: null,
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                    student: {
                        fullName: 'Nguyen Van A',
                        studentCode: '102210001',
                    },
                    template: {
                        name: 'Volunteer MVP Certificate',
                        layoutJson: {},
                        status: 'ACTIVE',
                    },
                    module: {
                        title: 'Tình nguyện viên sự kiện',
                    },
                    campaign: {
                        title: 'Campaign',
                    },
                })
            ;(certificatesRepository.updateCertificate as jest.Mock)
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({
                    id: 3001n,
                    status: 'READY',
                    fileHash: 'hash-1',
                    fileUrl: '/api/v1/certificates/3001/file',
                })
            ;(certificatesRepository.markBackgroundJobCompleted as jest.Mock).mockResolvedValue(
                {}
            )
            ;(certificatesRepository.createAuditLog as jest.Mock).mockResolvedValue(
                {}
            )

            const result = await certificatesService.processBackgroundJob('501')

            expect(certificatesRepository.markBackgroundJobRunning).toHaveBeenCalledWith(
                501n
            )
            expect(certificatesRepository.markBackgroundJobCompleted).toHaveBeenCalledWith(
                501n
            )
            expect(renderCertificatePdf).toHaveBeenCalled()
            expect(certificatesRepository.updateCertificate).toHaveBeenNthCalledWith(
                2,
                3001n,
                expect.objectContaining({
                    status: 'READY',
                    fileUrl: '/api/v1/certificates/3001/file',
                    fileHash: expect.any(String),
                })
            )
            expect(certificatesRepository.createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'CERTIFICATE_RENDERED',
                    entityId: 3001n,
                })
            )
            expect(result).toEqual({
                id: 501,
                type: 'RENDER_CERTIFICATE',
                status: 'COMPLETED',
                certificate_id: 3001,
            })
        })
    })

    describe('reissueCertificate', () => {
        it('should reject when certificate already has replacement', async () => {
            ;(certificatesRepository.findCertificateById as jest.Mock).mockResolvedValue({
                id: 3001n,
                status: 'REVOKED',
                replacementCertificateId: 4001n,
            })

            await expect(
                certificatesService.reissueCertificate('3001', {
                    accountType: 'OPERATOR',
                    userId: '9',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(certificatesRepository.createCertificate).not.toHaveBeenCalled()
        })
    })
})
