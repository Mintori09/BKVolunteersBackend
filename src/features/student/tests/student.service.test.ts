import * as studentRepo from '../student.repository'
import * as studentService from '../student.service'

jest.mock('../student.repository')

const dashboardDataFixture = {
    moneyDonations: [
        {
            id: 101n,
            campaignId: 1n,
            moduleId: 11n,
            status: 'VERIFIED',
            amount: 100000,
            donorName: 'Nguyen Van A',
            message: 'Ung ho',
            createdAt: new Date('2026-05-20T08:00:00.000Z'),
            campaign: { id: 1n, title: 'Quy hoc bong', slug: 'quy-hoc-bong' },
            module: { id: 11n, title: 'Quyen gop tien', type: 'FUNDRAISING' },
        },
        {
            id: 102n,
            campaignId: 1n,
            moduleId: 11n,
            status: 'PENDING',
            amount: 50000,
            donorName: 'Nguyen Van A',
            message: null,
            createdAt: new Date('2026-05-18T08:00:00.000Z'),
            campaign: { id: 1n, title: 'Quy hoc bong', slug: 'quy-hoc-bong' },
            module: { id: 11n, title: 'Quyen gop tien', type: 'FUNDRAISING' },
        },
    ],
    itemPledges: [
        {
            id: 201n,
            campaignId: 2n,
            moduleId: 21n,
            status: 'RECEIVED',
            quantity: 5,
            receivedQuantity: 4,
            donorName: 'Tran Thi B',
            createdAt: new Date('2026-05-17T08:00:00.000Z'),
            receivedAt: new Date('2026-05-20T09:00:00.000Z'),
            campaign: { id: 2n, title: 'Tiep suc mua thi', slug: 'tiep-suc-mua-thi' },
            module: { id: 21n, title: 'Vat pham ho tro', type: 'ITEM_DONATION' },
            itemTarget: { name: 'Sach giao khoa', unit: 'quyen' },
        },
        {
            id: 202n,
            campaignId: 2n,
            moduleId: 21n,
            status: 'CONFIRMED',
            quantity: 2,
            receivedQuantity: null,
            donorName: 'Tran Thi B',
            createdAt: new Date('2026-05-19T06:00:00.000Z'),
            receivedAt: null,
            campaign: { id: 2n, title: 'Tiep suc mua thi', slug: 'tiep-suc-mua-thi' },
            module: { id: 21n, title: 'Vat pham ho tro', type: 'ITEM_DONATION' },
            itemTarget: { name: 'But bi', unit: 'cay' },
        },
    ],
    eventRegistrations: [
        {
            id: 301n,
            campaignId: 3n,
            moduleId: 31n,
            status: 'COMPLETED',
            hours: 3,
            createdAt: new Date('2026-05-14T08:00:00.000Z'),
            reviewedAt: new Date('2026-05-15T08:00:00.000Z'),
            checkedInAt: new Date('2026-05-20T09:30:00.000Z'),
            checkedOutAt: new Date('2026-05-20T10:30:00.000Z'),
            campaign: { id: 3n, title: 'Ngay hoi hien mau', slug: 'ngay-hoi-hien-mau' },
            module: { id: 31n, title: 'Ca sang', type: 'EVENT' },
        },
        {
            id: 302n,
            campaignId: 3n,
            moduleId: 31n,
            status: 'APPROVED',
            hours: null,
            createdAt: new Date('2026-05-16T08:00:00.000Z'),
            reviewedAt: new Date('2026-05-19T08:30:00.000Z'),
            checkedInAt: null,
            checkedOutAt: null,
            campaign: { id: 3n, title: 'Ngay hoi hien mau', slug: 'ngay-hoi-hien-mau' },
            module: { id: 31n, title: 'Ca sang', type: 'EVENT' },
        },
    ],
    certificates: [
        {
            id: 401n,
            certificateNo: 'CERT-001',
            campaignId: 3n,
            moduleId: 31n,
            status: 'ISSUED',
            issuedAt: new Date('2026-05-19T12:00:00.000Z'),
            createdAt: new Date('2026-05-19T11:00:00.000Z'),
            campaign: { id: 3n, title: 'Ngay hoi hien mau', slug: 'ngay-hoi-hien-mau' },
            module: { id: 31n, title: 'Ca sang' },
            template: { name: 'Chung nhan tinh nguyen' },
        },
    ],
}

describe('student.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(studentRepo.findStudentDashboardData as jest.Mock).mockResolvedValue(
            dashboardDataFixture
        )
    })

    describe('getMyDashboard', () => {
        it('should aggregate verified, received and completed data across modules', async () => {
            const result = await studentService.getMyDashboard('42')

            expect(studentRepo.findStudentDashboardData).toHaveBeenCalledTimes(2)
            expect(studentRepo.findStudentDashboardData).toHaveBeenNthCalledWith(
                1,
                '42'
            )
            expect(studentRepo.findStudentDashboardData).toHaveBeenNthCalledWith(
                2,
                '42'
            )
            expect(result).toMatchObject({
                campaigns_count: 3,
                money_amount: 100000,
                money_donations_count: 1,
                item_received_quantity: 4,
                item_received_count: 1,
                event_hours: 3,
                event_completed_count: 1,
                certificates_count: 1,
            })
            expect(result.recent_activities).toHaveLength(7)
            expect(result.recent_activities.slice(0, 6)).toEqual([
                expect.objectContaining({
                    id: 'event-301',
                    activity_type: 'event_registration',
                    status: 'COMPLETED',
                    summary: 'Hoàn thành 3 giờ',
                }),
                expect.objectContaining({
                    id: 'item-201',
                    activity_type: 'item_pledge',
                    status: 'RECEIVED',
                    summary: '4 quyen Sach giao khoa',
                }),
                expect.objectContaining({
                    id: 'money-101',
                    activity_type: 'money_donation',
                    status: 'VERIFIED',
                    summary: 'Đóng góp 100.000đ',
                }),
                expect.objectContaining({
                    id: 'certificate-401',
                    activity_type: 'certificate',
                    status: 'ISSUED',
                    summary: 'Chứng nhận CERT-001',
                }),
                expect.objectContaining({
                    id: 'event-302',
                    activity_type: 'event_registration',
                    status: 'APPROVED',
                    summary: 'Đăng ký tham gia sự kiện',
                }),
                expect.objectContaining({
                    id: 'item-202',
                    activity_type: 'item_pledge',
                    status: 'CONFIRMED',
                    summary: '2 cay But bi',
                }),
            ])
        })
    })

    describe('getMyActivities', () => {
        it('should filter activities by type and preserve module type/status metadata', async () => {
            const result = await studentService.getMyActivities('42', {
                type: 'event_registration',
                page: 1,
                limit: 10,
            })

            expect(result).toEqual([
                expect.objectContaining({
                    id: 'event-301',
                    activity_type: 'event_registration',
                    module_type: 'event',
                    status: 'COMPLETED',
                    occurred_at: '2026-05-20T10:30:00.000Z',
                    meta: expect.objectContaining({
                        hours: 3,
                        checked_in_at: '2026-05-20T09:30:00.000Z',
                        checked_out_at: '2026-05-20T10:30:00.000Z',
                    }),
                }),
                expect.objectContaining({
                    id: 'event-302',
                    activity_type: 'event_registration',
                    module_type: 'event',
                    status: 'APPROVED',
                    occurred_at: '2026-05-19T08:30:00.000Z',
                }),
            ])
        })

        it('should filter activities by status and paginate the sorted result', async () => {
            const result = await studentService.getMyActivities('42', {
                status: 'CONFIRMED',
                page: 1,
                limit: 1,
            })

            expect(result).toEqual([
                expect.objectContaining({
                    id: 'item-202',
                    activity_type: 'item_pledge',
                    status: 'CONFIRMED',
                    module_type: 'item_donation',
                }),
            ])
        })
    })

    describe('getMyDonations', () => {
        it('should sort donations by occurred_at and keep received item metadata', async () => {
            const result = await studentService.getMyDonations('42')

            expect(studentRepo.findStudentDashboardData).toHaveBeenCalledWith('42')
            expect(result).toEqual([
                expect.objectContaining({
                    id: '201',
                    donation_type: 'item',
                    status: 'RECEIVED',
                    occurred_at: '2026-05-20T09:00:00.000Z',
                    meta: expect.objectContaining({
                        quantity: 4,
                        pledged_quantity: 5,
                        item_name: 'Sach giao khoa',
                        unit: 'quyen',
                    }),
                }),
                expect.objectContaining({
                    id: '101',
                    donation_type: 'money',
                    status: 'VERIFIED',
                    occurred_at: '2026-05-20T08:00:00.000Z',
                    meta: expect.objectContaining({
                        amount: 100000,
                        donor_name: 'Nguyen Van A',
                    }),
                }),
                expect.objectContaining({
                    id: '202',
                    donation_type: 'item',
                    status: 'CONFIRMED',
                }),
                expect.objectContaining({
                    id: '102',
                    donation_type: 'money',
                    status: 'PENDING',
                }),
            ])
        })

        it('should filter donations by type and status', async () => {
            const result = await studentService.getMyDonations('42', {
                type: 'money',
                status: 'VERIFIED',
                page: 1,
                limit: 10,
            })

            expect(result).toEqual([
                expect.objectContaining({
                    id: '101',
                    donation_type: 'money',
                    status: 'VERIFIED',
                }),
            ])
        })
    })
})
