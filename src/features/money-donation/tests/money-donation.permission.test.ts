import {
    canCreateMoneyPhase,
    canUpdateMoneyPhase,
    canDeleteMoneyPhase,
    canViewProgress,
    canViewPhaseDonations,
} from '../money-donation.permission'

describe('MoneyDonation Permission', () => {
    describe('canCreateMoneyPhase', () => {
        it('should deny SINHVIEN role', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'SINHVIEN')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Sinh viên không có quyền tạo giai đoạn quyên góp')
        })

        it('should deny if campaign already has money phase', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT', moneyPhase: { id: 1 } } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Chiến dịch đã có giai đoạn quyên góp tiền')
        })

        it('should allow DOANTRUONG role', () => {
            const campaign = { creatorId: 'other-user', status: 'ACTIVE' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'DOANTRUONG')

            expect(result.allowed).toBe(true)
        })

        it('should deny if not campaign creator', () => {
            const campaign = { creatorId: 'other-user', status: 'DRAFT' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không phải là người tạo chiến dịch này')
        })

        it('should deny if campaign status not DRAFT or PENDING', () => {
            const campaign = { creatorId: 'user-1', status: 'ACTIVE' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Chỉ có thể tạo giai đoạn khi chiến dịch ở trạng thái DRAFT hoặc PENDING')
        })

        it('should allow CLB creator with DRAFT status', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(true)
        })

        it('should allow CLB creator with PENDING status', () => {
            const campaign = { creatorId: 'user-1', status: 'PENDING' } as any

            const result = canCreateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(true)
        })
    })

    describe('canUpdateMoneyPhase', () => {
        it('should deny SINHVIEN role', () => {
            const campaign = { creatorId: 'user-1', status: 'ACTIVE' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'SINHVIEN')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Sinh viên không có quyền cập nhật giai đoạn quyên góp')
        })

        it('should allow DOANTRUONG role', () => {
            const campaign = { creatorId: 'other-user', status: 'ACTIVE' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'DOANTRUONG')

            expect(result.allowed).toBe(true)
        })

        it('should deny if not campaign creator', () => {
            const campaign = { creatorId: 'other-user', status: 'ACTIVE' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không phải là người tạo chiến dịch này')
        })

        it('should deny if campaign status not DRAFT or ACTIVE', () => {
            const campaign = { creatorId: 'user-1', status: 'COMPLETED' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Chỉ có thể cập nhật giai đoạn khi chiến dịch ở trạng thái DRAFT hoặc ACTIVE')
        })

        it('should allow CLB creator with DRAFT status', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(true)
        })

        it('should allow CLB creator with ACTIVE status', () => {
            const campaign = { creatorId: 'user-1', status: 'ACTIVE' } as any

            const result = canUpdateMoneyPhase(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(true)
        })
    })

    describe('canDeleteMoneyPhase', () => {
        it('should deny SINHVIEN role', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'SINHVIEN', 0)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Sinh viên không có quyền xóa giai đoạn quyên góp')
        })

        it('should deny if money phase is null', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any

            const result = canDeleteMoneyPhase(campaign, null, 'user-1', 'CLB', 0)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Giai đoạn quyên góp không tồn tại')
        })

        it('should deny DOANTRUONG if has donations', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'DOANTRUONG', 5)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Không thể xóa giai đoạn đã có đóng góp')
        })

        it('should allow DOANTRUONG if no donations', () => {
            const campaign = { creatorId: 'other-user', status: 'ACTIVE' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'DOANTRUONG', 0)

            expect(result.allowed).toBe(true)
        })

        it('should deny CLB if not creator', () => {
            const campaign = { creatorId: 'other-user', status: 'DRAFT' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'CLB', 0)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không phải là người tạo chiến dịch này')
        })

        it('should deny CLB if status not DRAFT', () => {
            const campaign = { creatorId: 'user-1', status: 'ACTIVE' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'CLB', 0)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Chỉ có thể xóa giai đoạn khi chiến dịch ở trạng thái DRAFT')
        })

        it('should deny CLB if has donations', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'CLB', 5)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Không thể xóa giai đoạn đã có đóng góp')
        })

        it('should allow CLB creator with DRAFT status and no donations', () => {
            const campaign = { creatorId: 'user-1', status: 'DRAFT' } as any
            const moneyPhase = { id: 1 } as any

            const result = canDeleteMoneyPhase(campaign, moneyPhase, 'user-1', 'CLB', 0)

            expect(result.allowed).toBe(true)
        })
    })

    describe('canViewProgress', () => {
        it('should allow ACTIVE status', () => {
            const campaign = { status: 'ACTIVE' } as any

            const result = canViewProgress(campaign)

            expect(result.allowed).toBe(true)
        })

        it('should allow COMPLETED status', () => {
            const campaign = { status: 'COMPLETED' } as any

            const result = canViewProgress(campaign)

            expect(result.allowed).toBe(true)
        })

        it('should deny DRAFT status', () => {
            const campaign = { status: 'DRAFT' } as any

            const result = canViewProgress(campaign)

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Chỉ có thể xem tiến độ chiến dịch đang hoạt động hoặc đã hoàn thành')
        })

        it('should deny PENDING status', () => {
            const campaign = { status: 'PENDING' } as any

            const result = canViewProgress(campaign)

            expect(result.allowed).toBe(false)
        })
    })

    describe('canViewPhaseDonations', () => {
        it('should deny SINHVIEN role', () => {
            const campaign = { creatorId: 'user-1' } as any

            const result = canViewPhaseDonations(campaign, 'user-1', 'SINHVIEN')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Sinh viên không có quyền xem danh sách đóng góp')
        })

        it('should allow DOANTRUONG role', () => {
            const campaign = { creatorId: 'other-user' } as any

            const result = canViewPhaseDonations(campaign, 'user-1', 'DOANTRUONG')

            expect(result.allowed).toBe(true)
        })

        it('should deny if not campaign creator', () => {
            const campaign = { creatorId: 'other-user' } as any

            const result = canViewPhaseDonations(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không phải là người tạo chiến dịch này')
        })

        it('should allow CLB creator', () => {
            const campaign = { creatorId: 'user-1' } as any

            const result = canViewPhaseDonations(campaign, 'user-1', 'CLB')

            expect(result.allowed).toBe(true)
        })
    })
})