import {
    CatalogApproval,
    CatalogCampaign,
    CatalogOrganization,
    CatalogStudentActivity,
    CatalogStudentDonation,
} from './catalog.types'

export const catalogOrganizations: CatalogOrganization[] = [
    {
        id: '1',
        code: 'BKV-CNTT',
        name: 'CLB Tinh Nguyen Khoa Cong nghe Thong tin',
        type: 'CLUB',
        slug: 'clb-tinh-nguyen-cntt',
        logo_url: null,
        description:
            'Don vi trien khai cac chien dich ho tro cong dong, day manh chuyen doi so va tinh nguyen hoc duong.',
        faculty: {
            id: 'faculty-1',
            name: 'Khoa Cong nghe Thong tin',
        },
        status: 'ACTIVE',
    },
    {
        id: '2',
        code: 'BKV-CK',
        name: 'Doi Thanh Nien Co khi',
        type: 'TEAM',
        slug: 'doi-thanh-nien-co-khi',
        logo_url: null,
        description:
            'Nhom xung kich chuyen phoi hop to chuc cac dot hien vat va ho tro hau can su kien.',
        faculty: {
            id: 'faculty-2',
            name: 'Khoa Co khi',
        },
        status: 'ACTIVE',
    },
    {
        id: '3',
        code: 'BKV-DT',
        name: 'Trung tam Ho tro Sinh vien BK',
        type: 'CENTER',
        slug: 'trung-tam-ho-tro-sinh-vien-bk',
        logo_url: null,
        description:
            'Dau moi ho tro ket noi doi tac, hoc bong va truong trinh tinh nguyen cap truong.',
        faculty: null,
        status: 'ACTIVE',
    },
]

export const catalogCampaigns: CatalogCampaign[] = [
    {
        id: 'campaign-1',
        slug: 'mua-he-xanh-so-hoa-2026',
        title: 'Mua He Xanh So Hoa 2026',
        summary:
            'Ho tro so hoa tai lieu hanh chinh, boi duong ky nang cong nghe va to chuc doi hinh tinh nguyen tai dia phuong.',
        description:
            'Chien dich ket hop tinh nguyen tai dia phuong voi cac workshop so hoa tai lieu, huong dan nguoi dan su dung dich vu cong truc tuyen va huy dong nguon luc ho tro hoc sinh.',
        cover_image_url: null,
        beneficiary: 'Hoc sinh va nguoi dan tai khu vuc ngoai thanh',
        scope_type: 'PUBLIC',
        status: 'ONGOING',
        start_at: '2026-06-15T00:00:00.000Z',
        end_at: '2026-08-15T00:00:00.000Z',
        published_at: '2026-06-01T08:00:00.000Z',
        organization_id: '1',
        module_types: ['event', 'fundraising'],
        modules: [
            {
                id: 'module-event-1',
                type: 'event',
                title: 'Doi hinh so hoa tai lieu',
                description:
                    'Tuyen tinh nguyen vien tham gia truc tai xa, ho tro so hoa va huong dan nguoi dan.',
                status: 'OPEN',
                start_at: '2026-06-20T00:00:00.000Z',
                end_at: '2026-07-20T00:00:00.000Z',
                settings: {
                    location:
                        'Xa Tan Lap, Huyen Bac Binh | Khu vuc so hoa va tiep nhan ho so',
                    quota: 250,
                    registration_required: true,
                    checkin_required: true,
                    benefits: ['Chung nhan', 'An trua', 'Dong phuc'],
                    benefits_text: 'Chung nhan tinh nguyen va an trua',
                },
                progress: {
                    current: 180,
                    target: 250,
                    percent: 72,
                },
                cta: {
                    enabled: true,
                    label: 'Dang mo dang ky',
                    action: 'register',
                },
                report: {
                    registrations: 230,
                    completed_registrations: 160,
                    completed_hours: 1280,
                },
            },
            {
                id: 'module-fundraising-1',
                type: 'fundraising',
                title: 'Quy hoc bong thiet bi hoc tap',
                description:
                    'Gay quy de bo sung thiet bi hoc tap, sim du lieu va tai lieu cho hoc sinh co hoan canh kho khan.',
                status: 'OPEN',
                start_at: '2026-06-10T00:00:00.000Z',
                end_at: '2026-08-10T00:00:00.000Z',
                settings: {
                    target_amount: 120000000,
                    receiver_name: 'CLB Tinh Nguyen CNTT',
                    bank_name: 'VCB',
                    bank_account_no: '001122334455',
                },
                progress: {
                    current: 76000000,
                    target: 120000000,
                    percent: 63,
                },
                cta: {
                    enabled: true,
                    label: 'Ung ho ngay',
                    action: 'donate',
                },
                report: {
                    verified_money_amount: 76000000,
                    total_donations: 54,
                    verified_donations: 49,
                },
            },
        ],
        reviews: [
            {
                id: 'review-c1-1',
                body: 'Ho so da bo sung du ke hoach bao hiem tinh nguyen vien.',
                visibility: 'PUBLIC',
                created_at: '2026-06-02T09:00:00.000Z',
            },
        ],
        issued_certificates: 42,
    },
    {
        id: 'campaign-2',
        slug: 'tiep-suc-mua-thi-2026',
        title: 'Tiep Suc Mua Thi 2026',
        summary:
            'Dong hanh voi thi sinh trong ky thi, ho tro thong tin, nuoc uong va diem nghi chan.',
        description:
            'Chuong trinh tap trung vao ho tro diem thi, bo sung vat pham nhu nuoc uong, ao mua va huong dan di chuyen cho thi sinh.',
        cover_image_url: null,
        beneficiary: 'Thi sinh THPT va phu huynh',
        scope_type: 'PUBLIC',
        status: 'PUBLISHED',
        start_at: '2026-06-25T00:00:00.000Z',
        end_at: '2026-07-10T00:00:00.000Z',
        published_at: '2026-06-03T10:00:00.000Z',
        organization_id: '2',
        module_types: ['item_donation', 'event'],
        modules: [
            {
                id: 'module-item-1',
                type: 'item_donation',
                title: 'Vat pham ho tro diem thi',
                description:
                    'Tiep nhan ao mua, nuoc suoi va bo dung cu hoc tap de phat tai diem thi.',
                status: 'OPEN',
                start_at: '2026-06-15T00:00:00.000Z',
                end_at: '2026-07-05T00:00:00.000Z',
                settings: {
                    receiver_address: 'Nha van hoa Sinh vien BK',
                    receiver_contact: '0909000001',
                    handover_note: 'Tiep nhan trong gio hanh chinh',
                    allow_over_target: false,
                },
                progress: {
                    current: 120,
                    target: 300,
                    percent: 40,
                },
                cta: {
                    enabled: true,
                    label: 'Dang ky hien vat',
                    action: 'pledge-item',
                },
                report: {
                    received_item_quantity: 120,
                },
            },
            {
                id: 'module-event-2',
                type: 'event',
                title: 'Truc diem thi va ho tro thi sinh',
                description:
                    'Dang ky truc diem thi, dieu phoi nguoi huong dan va ho tro thi sinh gap kho khan.',
                status: 'OPEN',
                start_at: '2026-06-25T00:00:00.000Z',
                end_at: '2026-06-28T00:00:00.000Z',
                settings: {
                    location: 'Cum diem thi Bach Khoa Co So Di An',
                    quota: 150,
                    registration_required: true,
                    checkin_required: true,
                    benefits: ['Ao doi hinh', 'Chung nhan'],
                    benefits_text: 'Chung nhan va ao doi hinh',
                },
                progress: {
                    current: 36,
                    target: 150,
                    percent: 24,
                },
                cta: {
                    enabled: true,
                    label: 'Mo dang ky tinh nguyen vien',
                    action: 'register',
                },
                report: {
                    registrations: 58,
                    completed_registrations: 0,
                    completed_hours: 0,
                },
            },
        ],
        reviews: [],
        issued_certificates: 0,
    },
    {
        id: 'campaign-3',
        slug: 'hoc-bong-cung-em-den-truong-2026',
        title: 'Hoc Bong Cung Em Den Truong 2026',
        summary:
            'Huy dong hoc bong va thiet bi hoc tap cho hoc sinh co hoan canh kho khan truoc nam hoc moi.',
        description:
            'Ke hoach gom gay quy, phoi hop doi tac tai tro va to chuc ngay hoi trao hoc bong tai cac truong THCS.',
        cover_image_url: null,
        beneficiary: 'Hoc sinh co hoan canh kho khan',
        scope_type: 'SCHOOL',
        status: 'SUBMITTED',
        start_at: '2026-08-01T00:00:00.000Z',
        end_at: '2026-09-30T00:00:00.000Z',
        published_at: null,
        organization_id: '3',
        module_types: ['fundraising', 'event'],
        modules: [
            {
                id: 'module-fundraising-2',
                type: 'fundraising',
                title: 'Quy hoc bong dau nam',
                description:
                    'Gay quy hoc bong tien mat va hoc cu cho hoc sinh can ho tro.',
                status: 'READY_FOR_REVIEW',
                start_at: '2026-08-01T00:00:00.000Z',
                end_at: '2026-09-15T00:00:00.000Z',
                settings: {
                    target_amount: 90000000,
                    receiver_name: 'Trung tam Ho tro Sinh vien BK',
                    bank_name: 'ACB',
                    bank_account_no: '7788990011',
                },
                progress: {
                    current: 0,
                    target: 90000000,
                    percent: 0,
                },
                cta: {
                    enabled: false,
                    label: 'Cho phe duyet',
                    action: null,
                },
                report: {
                    verified_money_amount: 0,
                    total_donations: 0,
                    verified_donations: 0,
                },
            },
            {
                id: 'module-event-3',
                type: 'event',
                title: 'Ngay hoi trao hoc bong',
                description:
                    'To chuc ngay hoi trao hoc bong va huong dan nhap hoc cho hoc sinh.',
                status: 'READY_FOR_REVIEW',
                start_at: '2026-09-20T00:00:00.000Z',
                end_at: '2026-09-25T00:00:00.000Z',
                settings: {
                    location: 'Hoi truong B4 - DH Bach Khoa',
                    quota: 60,
                    registration_required: true,
                    checkin_required: true,
                    benefits: ['Chung nhan', 'An trua'],
                    benefits_text: 'Chung nhan va suat an cho tinh nguyen vien',
                },
                progress: {
                    current: 0,
                    target: 60,
                    percent: 0,
                },
                cta: {
                    enabled: false,
                    label: 'Cho phe duyet',
                    action: null,
                },
                report: {
                    registrations: 0,
                    completed_registrations: 0,
                    completed_hours: 0,
                },
            },
        ],
        reviews: [
            {
                id: 'review-c3-1',
                body: 'Can bo sung bang phan bo chi phi va danh sach doi tac du kien.',
                visibility: 'PUBLIC',
                attachment_url: null,
                created_at: '2026-06-04T09:30:00.000Z',
            },
            {
                id: 'review-c3-2',
                body: 'Ho so da cap nhat ke hoach doi soat tai tro va tai lieu truyen thong.',
                visibility: 'INTERNAL',
                attachment_url: null,
                created_at: '2026-06-04T15:00:00.000Z',
            },
        ],
        issued_certificates: 0,
    },
    {
        id: 'campaign-4',
        slug: 'tu-sach-cong-dong-2026',
        title: 'Tu Sach Cong Dong 2026',
        summary:
            'Xay dung tu sach cong dong va bo tri tinh nguyen vien ho tro doc sach cho tre em.',
        description:
            'Chien dich ket hop tiep nhan sach, sap xep khong gian doc va to chuc ngay hoi doc sach cho tre em.',
        cover_image_url: null,
        beneficiary: 'Tre em tai khu nha tro cong nhan',
        scope_type: 'FACULTY',
        status: 'PRE_APPROVED',
        start_at: '2026-07-05T00:00:00.000Z',
        end_at: '2026-08-30T00:00:00.000Z',
        published_at: null,
        organization_id: '1',
        module_types: ['item_donation', 'event'],
        modules: [
            {
                id: 'module-item-2',
                type: 'item_donation',
                title: 'Tiep nhan sach va dung cu hoc tap',
                description:
                    'Tiep nhan sach thieu nhi, sach giao khoa va dung cu hoc tap.',
                status: 'APPROVED',
                start_at: '2026-07-05T00:00:00.000Z',
                end_at: '2026-08-10T00:00:00.000Z',
                settings: {
                    receiver_address: 'Van phong CLB Tinh nguyen CNTT',
                    receiver_contact: '0909000002',
                    handover_note: 'Nhan sach vao thu 3, 5, 7',
                    allow_over_target: true,
                },
                progress: {
                    current: 20,
                    target: 200,
                    percent: 10,
                },
                cta: {
                    enabled: false,
                    label: 'Sap cong khai',
                    action: null,
                },
                report: {
                    received_item_quantity: 20,
                },
            },
        ],
        reviews: [
            {
                id: 'review-c4-1',
                body: 'Da hoan tat so duyet cap khoa, cho phe duyet cap truong.',
                visibility: 'INTERNAL',
                created_at: '2026-06-05T08:00:00.000Z',
            },
        ],
        issued_certificates: 0,
    },
]

export const catalogApprovals: CatalogApproval[] = [
    {
        id: 'approval-1',
        campaign_id: 'campaign-3',
        status: 'SUBMITTED',
        submitted_at: '2026-06-04T08:00:00.000Z',
    },
    {
        id: 'approval-2',
        campaign_id: 'campaign-4',
        status: 'PRE_APPROVED',
        submitted_at: '2026-06-05T08:30:00.000Z',
    },
]

export const catalogStudentActivities: CatalogStudentActivity[] = [
    {
        id: 'activity-1',
        activity_type: 'event_registration',
        reference_id: 'REG-2026-001',
        campaign_id: 'campaign-1',
        campaign_title: 'Mua He Xanh So Hoa 2026',
        campaign_slug: 'mua-he-xanh-so-hoa-2026',
        module_id: 'module-event-1',
        module_title: 'Doi hinh so hoa tai lieu',
        module_type: 'event',
        status: 'COMPLETED',
        occurred_at: '2026-07-15T09:00:00.000Z',
        meta: {
            hours: 24,
        },
    },
    {
        id: 'activity-2',
        activity_type: 'money_donation',
        reference_id: 'DON-2026-101',
        campaign_id: 'campaign-1',
        campaign_title: 'Mua He Xanh So Hoa 2026',
        campaign_slug: 'mua-he-xanh-so-hoa-2026',
        module_id: 'module-fundraising-1',
        module_title: 'Quy hoc bong thiet bi hoc tap',
        module_type: 'fundraising',
        status: 'VERIFIED',
        occurred_at: '2026-06-25T10:00:00.000Z',
        meta: {
            amount: 500000,
        },
    },
    {
        id: 'activity-3',
        activity_type: 'item_pledge',
        reference_id: 'PLG-2026-201',
        campaign_id: 'campaign-2',
        campaign_title: 'Tiep Suc Mua Thi 2026',
        campaign_slug: 'tiep-suc-mua-thi-2026',
        module_id: 'module-item-1',
        module_title: 'Vat pham ho tro diem thi',
        module_type: 'item_donation',
        status: 'RECEIVED',
        occurred_at: '2026-06-18T11:00:00.000Z',
        meta: {
            quantity: 12,
            unit: 'thung',
        },
    },
    {
        id: 'activity-4',
        activity_type: 'certificate',
        reference_id: 'CERT-2026-001',
        campaign_id: 'campaign-1',
        campaign_title: 'Mua He Xanh So Hoa 2026',
        campaign_slug: 'mua-he-xanh-so-hoa-2026',
        module_id: 'module-event-1',
        module_title: 'Doi hinh so hoa tai lieu',
        module_type: 'event',
        status: 'SIGNED',
        occurred_at: '2026-07-25T08:30:00.000Z',
        meta: {},
    },
]

export const catalogStudentDonations: CatalogStudentDonation[] = [
    {
        id: 'student-donation-1',
        donation_type: 'money',
        reference_id: 'DON-2026-101',
        campaign_id: 'campaign-1',
        campaign_title: 'Mua He Xanh So Hoa 2026',
        campaign_slug: 'mua-he-xanh-so-hoa-2026',
        module_id: 'module-fundraising-1',
        module_title: 'Quy hoc bong thiet bi hoc tap',
        status: 'VERIFIED',
        occurred_at: '2026-06-25T10:00:00.000Z',
        meta: {
            amount: 500000,
        },
    },
    {
        id: 'student-donation-2',
        donation_type: 'item',
        reference_id: 'PLG-2026-201',
        campaign_id: 'campaign-2',
        campaign_title: 'Tiep Suc Mua Thi 2026',
        campaign_slug: 'tiep-suc-mua-thi-2026',
        module_id: 'module-item-1',
        module_title: 'Vat pham ho tro diem thi',
        status: 'RECEIVED',
        occurred_at: '2026-06-18T11:00:00.000Z',
        meta: {
            quantity: 12,
            unit: 'thung',
        },
    },
]
