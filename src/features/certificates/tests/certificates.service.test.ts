import { HttpStatus } from 'src/common/constants'
import * as certificatesRepository from '../certificates.repository'
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

describe('certificates.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
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
                status: 'ISSUED',
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
})
