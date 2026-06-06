import { NotificationRecord } from './notifications.types'

export const initialNotifications: NotificationRecord[] = [
    {
        id: 'notification-1',
        type: 'campaign_update',
        title: 'Chien dich Mua He Xanh So Hoa da duoc mo dang ky',
        body: 'Ban co the bat dau dang ky doi hinh tinh nguyen vien va theo doi tien do tren bang dieu khien.',
        read_at: null,
        created_at: '2026-06-05T08:00:00.000Z',
        data: {
            campaign_id: 'campaign-1',
            campaign_slug: 'mua-he-xanh-so-hoa-2026',
        },
    },
    {
        id: 'notification-2',
        type: 'approval_notice',
        title: 'Ho so Hoc Bong Cung Em Den Truong can bo sung',
        body: 'Doan truong da yeu cau cap nhat bang phan bo chi phi truoc khi phe duyet.',
        read_at: null,
        created_at: '2026-06-05T09:00:00.000Z',
        data: {
            approval_id: 'approval-1',
            campaign_id: 'campaign-3',
        },
    },
    {
        id: 'notification-3',
        type: 'system_warning',
        title: 'Bao tri he thong cap nhat file chung nhan',
        body: 'He thong se bao tri trong 30 phut sau 22:00 de cap nhat pipeline render chung nhan.',
        read_at: '2026-06-05T07:45:00.000Z',
        created_at: '2026-06-05T07:30:00.000Z',
    },
]
