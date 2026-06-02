import { HttpStatus } from 'src/common/constants'
import * as eventsRepository from '../events.repository'
import * as eventsService from '../events.service'
import * as notificationService from 'src/features/notification/notification.service'

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

jest.mock('../events.repository')
jest.mock('src/features/notification/notification.service', () => ({
    createForStudent: jest.fn(),
}))

describe('events.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('updateEventConfig', () => {
        it('should normalize benefits and allow zero quota', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                settingsJson: {
                    location: 'Cu',
                    quota: 5,
                },
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
            })
            ;(eventsRepository.updateModuleConfig as jest.Mock).mockResolvedValue({
                id: 11n,
                settingsJson: {
                    location: 'Hoi truong B1',
                    quota: 0,
                    registration_required: true,
                    checkin_required: false,
                    benefits: ['Cong diem', 'Giay chung nhan'],
                },
            })

            const result = await eventsService.updateEventConfig(
                '11',
                {
                    location: 'Hoi truong B1',
                    quota: 0,
                    registration_required: true,
                    checkin_required: false,
                    benefits: [' Cong diem ', 'Giay chung nhan', 'Cong diem'],
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.updateModuleConfig).toHaveBeenCalledWith({
                moduleId: 11n,
                settingsJson: {
                    location: 'Hoi truong B1',
                    quota: 0,
                    registration_required: true,
                    checkin_required: false,
                    benefits: ['Cong diem', 'Giay chung nhan'],
                },
            })
            expect(result).toEqual({
                module_id: 11,
                config: {
                    location: 'Hoi truong B1',
                    quota: 0,
                    registration_required: true,
                    checkin_required: false,
                    benefits: ['Cong diem', 'Giay chung nhan'],
                },
            })
        })
    })

    describe('registerEvent', () => {
        it('should reject non-student principal', async () => {
            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should reject missing module', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue(
                null
            )

            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })

        it('should create pending registration for student', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 100,
                    registration_required: true,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue(null)
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            ).mockResolvedValue(5)
            ;(eventsRepository.createRegistration as jest.Mock).mockResolvedValue({
                id: 101n,
                moduleId: 11n,
                status: 'PENDING',
            })

            const result = await eventsService.registerEvent(
                '11',
                { answers_json: { shirt_size: 'M' } },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(eventsRepository.createRegistration).toHaveBeenCalledWith({
                moduleId: 11n,
                campaignId: 7n,
                studentId: 42n,
                answersJson: { shirt_size: 'M' },
                status: 'PENDING',
            })
            expect(result).toEqual({
                id: 101,
                status: 'PENDING',
                module_id: 11,
            })
        })

        it('should reject duplicate registration for the same student', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 100,
                    registration_required: true,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue({
                id: 101n,
                moduleId: 11n,
                studentId: 42n,
                status: 'PENDING',
            })

            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.createRegistration).not.toHaveBeenCalled()
        })

        it('should reject registration when quota is full', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 2,
                    registration_required: true,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue(null)
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            ).mockResolvedValue(2)

            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.createRegistration).not.toHaveBeenCalled()
        })

        it('should auto-approve registration when approval is not required', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 0,
                    registration_required: false,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue(null)
            ;(eventsRepository.createRegistration as jest.Mock).mockResolvedValue({
                id: 102n,
                moduleId: 11n,
                status: 'APPROVED',
            })

            const result = await eventsService.registerEvent(
                '11',
                { answers: { note: 'Co the truc ca sang' } },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(eventsRepository.countRegistrationsByModule).not.toHaveBeenCalled()
            expect(eventsRepository.createRegistration).toHaveBeenCalledWith({
                moduleId: 11n,
                campaignId: 7n,
                studentId: 42n,
                answersJson: { note: 'Co the truc ca sang' },
                status: 'APPROVED',
            })
            expect(result).toEqual({
                id: 102,
                status: 'APPROVED',
                module_id: 11,
            })
        })
    })

    describe('approveEventRegistration', () => {
        it('should reject non-operator principal', async () => {
            await expect(
                eventsService.approveEventRegistration(
                    '101',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should approve registration with operator reviewer', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 101n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: { quota: 100 },
                },
                student: {
                    id: 42n,
                },
            })
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            ).mockResolvedValue(10)
            ;(eventsRepository.approveRegistration as jest.Mock).mockResolvedValue({
                id: 101n,
                status: 'APPROVED',
            })

            const result = await eventsService.approveEventRegistration(
                '101',
                { note: 'Dat yeu cau' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.approveRegistration).toHaveBeenCalledWith({
                id: 101n,
                reviewedBy: 9n,
                note: 'Dat yeu cau',
            })
            expect(result).toEqual({
                id: 101,
                status: 'APPROVED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'PARTICIPANT_APPROVED',
                title: 'Đăng ký sự kiện đã được duyệt',
                message: 'Đăng ký Tiep suc mua thi của bạn đã được duyệt.',
                dataJson: {
                    registration_id: 101,
                    campaign_id: 7,
                    module_id: 11,
                },
            })
        })

        it('should reject approve when registration is not pending', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 101n,
                status: 'APPROVED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: { quota: 100 },
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                eventsService.approveEventRegistration(
                    '101',
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.approveRegistration).not.toHaveBeenCalled()
        })

        it('should reject approve when quota is full at review time', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 101n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: { quota: 2 },
                },
                student: {
                    id: 42n,
                },
            })
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            ).mockResolvedValue(2)

            await expect(
                eventsService.approveEventRegistration(
                    '101',
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.approveRegistration).not.toHaveBeenCalled()
        })
    })

    describe('rejectEventRegistration', () => {
        it('should reject registration from pending status and notify student', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 103n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.rejectRegistration as jest.Mock).mockResolvedValue({
                id: 103n,
                status: 'REJECTED',
            })

            const result = await eventsService.rejectEventRegistration(
                '103',
                { reason: 'Da du nhan su cho ca nay' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.rejectRegistration).toHaveBeenCalledWith({
                id: 103n,
                reviewedBy: 9n,
                reason: 'Da du nhan su cho ca nay',
            })
            expect(result).toEqual({
                id: 103,
                status: 'REJECTED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'PARTICIPANT_REJECTED',
                title: 'Đăng ký sự kiện bị từ chối',
                message: 'Da du nhan su cho ca nay',
                dataJson: {
                    registration_id: 103,
                    campaign_id: 7,
                    module_id: 11,
                },
            })
        })

        it('should reject approved registration and allow reviewer rollback', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 104n,
                status: 'APPROVED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.rejectRegistration as jest.Mock).mockResolvedValue({
                id: 104n,
                status: 'REJECTED',
            })

            const result = await eventsService.rejectEventRegistration(
                '104',
                { reason: 'Doi lich to chuc' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(result).toEqual({
                id: 104,
                status: 'REJECTED',
            })
        })

        it('should reject invalid reject transition for checked-in registration', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 105n,
                status: 'CHECKED_IN',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                eventsService.rejectEventRegistration(
                    '105',
                    { reason: 'Khong con hop le' },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.rejectRegistration).not.toHaveBeenCalled()
        })
    })

    describe('checkInEventRegistration', () => {
        it('should check in approved registration and notify student', async () => {
            const checkedInAt = new Date('2026-05-20T08:00:00.000Z')
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 106n,
                status: 'APPROVED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.checkInRegistration as jest.Mock).mockResolvedValue({
                id: 106n,
                status: 'CHECKED_IN',
            })

            const result = await eventsService.checkInEventRegistration(
                '106',
                { checked_in_at: checkedInAt.toISOString() },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.checkInRegistration).toHaveBeenCalledWith({
                id: 106n,
                checkedInAt,
            })
            expect(result).toEqual({
                id: 106,
                status: 'CHECKED_IN',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'PARTICIPANT_CHECKED_IN',
                title: 'Đã check-in sự kiện',
                message: 'Tiep suc mua thi đã ghi nhận check-in của bạn.',
                dataJson: {
                    registration_id: 106,
                    campaign_id: 7,
                    module_id: 11,
                },
            })
        })

        it('should reject check-in when registration is not approved', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 106n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                eventsService.checkInEventRegistration(
                    '106',
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.checkInRegistration).not.toHaveBeenCalled()
        })
    })

    describe('completeEventRegistration', () => {
        it('should complete checked-in registration when check-in is required', async () => {
            const checkedOutAt = new Date('2026-05-20T11:30:00.000Z')
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 107n,
                status: 'CHECKED_IN',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: {
                        checkin_required: true,
                    },
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.completeRegistration as jest.Mock).mockResolvedValue({
                id: 107n,
                status: 'COMPLETED',
            })

            const result = await eventsService.completeEventRegistration(
                '107',
                {
                    checked_out_at: checkedOutAt.toISOString(),
                    hours: 4,
                    note: 'Hoan thanh ca sang',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.completeRegistration).toHaveBeenCalledWith({
                id: 107n,
                checkedOutAt,
                hours: 4,
                note: 'Hoan thanh ca sang',
            })
            expect(result).toEqual({
                id: 107,
                status: 'COMPLETED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'PARTICIPANT_COMPLETED',
                title: 'Đã ghi nhận hoàn thành sự kiện',
                message: 'Tiep suc mua thi đã được ghi nhận hoàn thành.',
                dataJson: {
                    registration_id: 107,
                    campaign_id: 7,
                    module_id: 11,
                    hours: 4,
                },
            })
        })

        it('should reject complete when check-in is required but missing', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 107n,
                status: 'APPROVED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: {
                        checkin_required: true,
                    },
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                eventsService.completeEventRegistration(
                    '107',
                    { hours: 4 },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.completeRegistration).not.toHaveBeenCalled()
        })

        it('should complete approved registration when check-in is optional', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 108n,
                status: 'APPROVED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: {
                        checkin_required: false,
                    },
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.completeRegistration as jest.Mock).mockResolvedValue({
                id: 108n,
                status: 'COMPLETED',
            })

            const result = await eventsService.completeEventRegistration(
                '108',
                {
                    hours: 2,
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(eventsRepository.completeRegistration).toHaveBeenCalledWith({
                id: 108n,
                checkedOutAt: null,
                hours: 2,
                note: null,
            })
            expect(result).toEqual({
                id: 108,
                status: 'COMPLETED',
            })
        })

        it('should reject invalid complete transition when status is pending', async () => {
            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 109n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                    settingsJson: {
                        checkin_required: false,
                    },
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                eventsService.completeEventRegistration(
                    '109',
                    { hours: 1 },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })

            expect(eventsRepository.completeRegistration).not.toHaveBeenCalled()
        })
    })

    describe('event journey', () => {
        it('should cover register -> approve -> check-in -> complete flow', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 5,
                    registration_required: true,
                    checkin_required: true,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue(null)
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            )
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(1)
            ;(eventsRepository.createRegistration as jest.Mock).mockResolvedValue({
                id: 201n,
                moduleId: 11n,
                status: 'PENDING',
            })

            const created = await eventsService.registerEvent(
                '11',
                { answers: { note: 'Co the truc ca ngay' } },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(created).toEqual({
                id: 201,
                status: 'PENDING',
                module_id: 11,
            })

            ;(eventsRepository.findRegistrationById as jest.Mock)
                .mockResolvedValueOnce({
                    id: 201n,
                    status: 'PENDING',
                    campaign: {
                        id: 7n,
                        organizationId: 5n,
                    },
                    module: {
                        id: 11n,
                        title: 'Tiep suc mua thi',
                        settingsJson: {
                            quota: 5,
                            checkin_required: true,
                        },
                    },
                    student: {
                        id: 42n,
                    },
                })
                .mockResolvedValueOnce({
                    id: 201n,
                    status: 'APPROVED',
                    campaign: {
                        id: 7n,
                        organizationId: 5n,
                    },
                    module: {
                        id: 11n,
                        title: 'Tiep suc mua thi',
                    },
                    student: {
                        id: 42n,
                    },
                })
                .mockResolvedValueOnce({
                    id: 201n,
                    status: 'CHECKED_IN',
                    campaign: {
                        id: 7n,
                        organizationId: 5n,
                    },
                    module: {
                        id: 11n,
                        title: 'Tiep suc mua thi',
                        settingsJson: {
                            checkin_required: true,
                        },
                    },
                    student: {
                        id: 42n,
                    },
                })
            ;(eventsRepository.approveRegistration as jest.Mock).mockResolvedValue({
                id: 201n,
                status: 'APPROVED',
            })
            ;(eventsRepository.checkInRegistration as jest.Mock).mockResolvedValue({
                id: 201n,
                status: 'CHECKED_IN',
            })
            ;(eventsRepository.completeRegistration as jest.Mock).mockResolvedValue({
                id: 201n,
                status: 'COMPLETED',
            })

            const approved = await eventsService.approveEventRegistration(
                '201',
                { review_note: 'Dat yeu cau' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )
            const checkedInAt = new Date('2026-05-20T08:00:00.000Z')
            const checkedIn = await eventsService.checkInEventRegistration(
                '201',
                { checked_in_at: checkedInAt.toISOString() },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )
            const completed = await eventsService.completeEventRegistration(
                '201',
                {
                    checked_out_at: '2026-05-20T11:30:00.000Z',
                    hours: 4,
                    note: 'Hoan thanh ca sang',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(approved).toEqual({
                id: 201,
                status: 'APPROVED',
            })
            expect(checkedIn).toEqual({
                id: 201,
                status: 'CHECKED_IN',
            })
            expect(completed).toEqual({
                id: 201,
                status: 'COMPLETED',
            })
            expect(notificationService.createForStudent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    studentId: '42',
                    type: 'PARTICIPANT_APPROVED',
                })
            )
            expect(notificationService.createForStudent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    studentId: '42',
                    type: 'PARTICIPANT_CHECKED_IN',
                })
            )
            expect(notificationService.createForStudent).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    studentId: '42',
                    type: 'PARTICIPANT_COMPLETED',
                })
            )
        })

        it('should cover register -> reject flow', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    quota: 5,
                    registration_required: true,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                eventsRepository.findRegistrationByModuleAndStudent as jest.Mock
            ).mockResolvedValue(null)
            ;(
                eventsRepository.countRegistrationsByModule as jest.Mock
            ).mockResolvedValueOnce(0)
            ;(eventsRepository.createRegistration as jest.Mock).mockResolvedValue({
                id: 202n,
                moduleId: 11n,
                status: 'PENDING',
            })

            const created = await eventsService.registerEvent(
                '11',
                { answers_json: { note: 'Muon dang ky ca toi' } },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(created).toEqual({
                id: 202,
                status: 'PENDING',
                module_id: 11,
            })

            ;(eventsRepository.findRegistrationById as jest.Mock).mockResolvedValue({
                id: 202n,
                status: 'PENDING',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 11n,
                    title: 'Tiep suc mua thi',
                },
                student: {
                    id: 42n,
                },
            })
            ;(eventsRepository.rejectRegistration as jest.Mock).mockResolvedValue({
                id: 202n,
                status: 'REJECTED',
            })

            const rejected = await eventsService.rejectEventRegistration(
                '202',
                { reason: 'Da du nhan su cho ca nay' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(rejected).toEqual({
                id: 202,
                status: 'REJECTED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith(
                expect.objectContaining({
                    studentId: '42',
                    type: 'PARTICIPANT_REJECTED',
                })
            )
        })
    })
})
