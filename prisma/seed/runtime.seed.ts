import argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

const date = (value: string) => new Date(value)

const clubSeeds = [
    {
        id: 'club-1',
        userId: 'clb-user',
        managerId: 'manager-clb-1',
        name: 'CLB Tình nguyện CNTT',
        facultyCode: '102',
        isSchoolLevel: false,
    },
    {
        id: 'club-2',
        userId: 'clb-user-02',
        managerId: 'manager-clb-2',
        name: 'CLB Tình nguyện Trái Tim Xanh',
        facultyCode: '117',
        isSchoolLevel: true,
    },
    {
        id: 'club-3',
        userId: 'clb-user-03',
        managerId: 'manager-clb-3',
        name: 'CLB Hiến máu Nhân Ái',
        facultyCode: '105',
        isSchoolLevel: true,
    },
    {
        id: 'club-4',
        userId: 'clb-user-04',
        managerId: 'manager-clb-4',
        name: 'CLB Môi trường Xanh',
        facultyCode: '117',
        isSchoolLevel: false,
    },
    {
        id: 'club-5',
        userId: 'clb-user-05',
        managerId: 'manager-clb-5',
        name: 'CLB Kỹ năng Sinh viên',
        facultyCode: '102',
        isSchoolLevel: true,
    },
    {
        id: 'club-6',
        userId: 'clb-user-06',
        managerId: 'manager-clb-6',
        name: 'CLB Công nghệ vì Cộng đồng',
        facultyCode: '123',
        isSchoolLevel: true,
    },
    {
        id: 'club-7',
        userId: 'clb-user-07',
        managerId: 'manager-clb-7',
        name: 'CLB Sách và Hành động Bách Khoa',
        facultyCode: '121',
        isSchoolLevel: false,
    },
    {
        id: 'club-8',
        userId: 'clb-user-08',
        managerId: 'manager-clb-8',
        name: 'CLB Chung Tay Áo Ấm',
        facultyCode: '110',
        isSchoolLevel: false,
    },
    {
        id: 'club-9',
        userId: 'clb-user-09',
        managerId: 'manager-clb-9',
        name: 'CLB Thanh niên Khởi nghiệp Xanh',
        facultyCode: '118',
        isSchoolLevel: true,
    },
    {
        id: 'club-10',
        userId: 'clb-user-10',
        managerId: 'manager-clb-10',
        name: 'CLB Hỗ trợ Tân sinh viên',
        facultyCode: '102',
        isSchoolLevel: true,
    },
] as const

const lcdFacultyCodes = [
    '102',
    '105',
    '106',
    '107',
    '109',
    '110',
    '111',
    '117',
    '118',
    '121',
    '123',
    '101',
    '103',
    '104',
] as const

const studentSeeds = [
    {
        userId: 'student-user',
        studentId: 'student-1',
        mssv: '21119999',
        fullName: 'Nguyễn Văn An',
        facultyCode: '102',
        className: '21TCLC_DT1',
        phone: '0905000001',
        totalPoints: 185,
    },
    {
        userId: 'student-user-2',
        studentId: 'student-2',
        mssv: '21118888',
        fullName: 'Lê Thị Bình',
        facultyCode: '117',
        className: '21MT1',
        phone: '0905000002',
        totalPoints: 120,
    },
    {
        userId: 'student-user-3',
        studentId: 'student-3',
        mssv: '21117777',
        fullName: 'Phạm Quốc Cường',
        facultyCode: '105',
        className: '21D1',
        phone: '0905000003',
        totalPoints: 150,
    },
    {
        userId: 'student-user-4',
        studentId: 'student-4',
        mssv: '21116666',
        fullName: 'Trần Thu Hà',
        facultyCode: '106',
        className: '21VT1',
        phone: '0905000004',
        totalPoints: 210,
    },
    {
        userId: 'student-user-5',
        studentId: 'student-5',
        mssv: '21115555',
        fullName: 'Võ Minh Khang',
        facultyCode: '109',
        className: '21CD1',
        phone: '0905000005',
        totalPoints: 95,
    },
    {
        userId: 'student-user-6',
        studentId: 'student-6',
        mssv: '21114444',
        fullName: 'Đặng Hải My',
        facultyCode: '110',
        className: '21XD1',
        phone: '0905000006',
        totalPoints: 240,
    },
    {
        userId: 'student-user-7',
        studentId: 'student-7',
        mssv: '21113333',
        fullName: 'Ngô Gia Bảo',
        facultyCode: '121',
        className: '21KT1',
        phone: '0905000007',
        totalPoints: 75,
    },
    {
        userId: 'student-user-8',
        studentId: 'student-8',
        mssv: '21112222',
        fullName: 'Bùi Thanh Hương',
        facultyCode: '123',
        className: '21ATTT1',
        phone: '0905000008',
        totalPoints: 165,
    },
    {
        userId: 'student-user-9',
        studentId: 'student-9',
        mssv: '21111111',
        fullName: 'Hoàng Đức Long',
        facultyCode: '118',
        className: '21QLDA1',
        phone: '0905000009',
        totalPoints: 135,
    },
    {
        userId: 'student-user-10',
        studentId: 'student-10',
        mssv: '21110010',
        fullName: 'Lý Khánh Linh',
        facultyCode: '101',
        className: '21CK1',
        phone: '0905000010',
        totalPoints: 90,
    },
    {
        userId: 'student-user-11',
        studentId: 'student-11',
        mssv: '21110011',
        fullName: 'Tạ Nhật Minh',
        facultyCode: '103',
        className: '21CG1',
        phone: '0905000011',
        totalPoints: 110,
    },
    {
        userId: 'student-user-12',
        studentId: 'student-12',
        mssv: '21110012',
        fullName: 'Dương Quỳnh Nhi',
        facultyCode: '104',
        className: '21NĐL1',
        phone: '0905000012',
        totalPoints: 130,
    },
] as const

const seedFiles = [
    {
        id: 'file-avatar-board',
        bucketName: 'public-assets',
        storageKey: 'avatars/board-user.jpg',
        visibility: 'PUBLIC',
        originalName: 'avatar-doan-truong.jpg',
        mimeType: 'image/jpeg',
        fileSize: 120000n,
        extension: 'jpg',
        publicUrl: 'https://storage.local/public-assets/avatars/board-user.jpg',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-avatar-student-1',
        bucketName: 'public-assets',
        storageKey: 'avatars/student-1.jpg',
        visibility: 'PUBLIC',
        originalName: 'avatar-nguyen-van-an.jpg',
        mimeType: 'image/jpeg',
        fileSize: 118000n,
        extension: 'jpg',
        publicUrl: 'https://storage.local/public-assets/avatars/student-1.jpg',
        uploadedByManagerId: null,
        uploadedByStudentId: 'student-1',
    },
    {
        id: 'file-campaign-cover-1',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-1/cover.jpg',
        visibility: 'PUBLIC',
        originalName: 'xuan-yeu-thuong-cover.jpg',
        mimeType: 'image/jpeg',
        fileSize: 245000n,
        extension: 'jpg',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-1/cover.jpg',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-campaign-logo-1',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-1/logo.png',
        visibility: 'PUBLIC',
        originalName: 'xuan-yeu-thuong-logo.png',
        mimeType: 'image/png',
        fileSize: 64000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-1/logo.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-campaign-cover-2',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-2/cover.jpg',
        visibility: 'PUBLIC',
        originalName: 'ao-am-vung-cao-cover.jpg',
        mimeType: 'image/jpeg',
        fileSize: 231000n,
        extension: 'jpg',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-2/cover.jpg',
        uploadedByManagerId: 'manager-clb-1',
        uploadedByStudentId: null,
    },
    {
        id: 'file-campaign-cover-3',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-3/cover.jpg',
        visibility: 'PUBLIC',
        originalName: 'tiep-suc-mua-thi-cover.jpg',
        mimeType: 'image/jpeg',
        fileSize: 219000n,
        extension: 'jpg',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-3/cover.jpg',
        uploadedByManagerId: 'manager-lcd-1',
        uploadedByStudentId: null,
    },
    {
        id: 'file-doc-campaign-1',
        bucketName: 'private-files',
        storageKey: 'campaigns/campaign-1/master-plan.pdf',
        visibility: 'PRIVATE',
        originalName: 'ke-hoach-xuan-yeu-thuong-2026.pdf',
        mimeType: 'application/pdf',
        fileSize: 425000n,
        extension: 'pdf',
        publicUrl: null,
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-doc-campaign-2',
        bucketName: 'private-files',
        storageKey: 'campaigns/campaign-2/budget.xlsx',
        visibility: 'PRIVATE',
        originalName: 'du-toan-ao-am-cho-em.xlsx',
        mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 56000n,
        extension: 'xlsx',
        publicUrl: null,
        uploadedByManagerId: 'manager-clb-1',
        uploadedByStudentId: null,
    },
    {
        id: 'file-media-campaign-1',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-1/media/photo-1.jpg',
        visibility: 'PUBLIC',
        originalName: 'anh-xuan-yeu-thuong-1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 178000n,
        extension: 'jpg',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-1/media/photo-1.jpg',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-media-campaign-3',
        bucketName: 'public-assets',
        storageKey: 'campaigns/campaign-3/media/photo-1.jpg',
        visibility: 'PUBLIC',
        originalName: 'anh-tiep-suc-mua-thi-1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 165000n,
        extension: 'jpg',
        publicUrl:
            'https://storage.local/public-assets/campaigns/campaign-3/media/photo-1.jpg',
        uploadedByManagerId: 'manager-lcd-1',
        uploadedByStudentId: null,
    },
    {
        id: 'file-qr-fundraising-2',
        bucketName: 'public-assets',
        storageKey: 'payments/module-fundraising-2/qr.png',
        visibility: 'PUBLIC',
        originalName: 'qr-gay-quy-ho-tro-sinh-vien.png',
        mimeType: 'image/png',
        fileSize: 34000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/payments/module-fundraising-2/qr.png',
        uploadedByManagerId: 'manager-lcd-1',
        uploadedByStudentId: null,
    },
    {
        id: 'file-money-proof-1',
        bucketName: 'private-files',
        storageKey: 'donations/donation-101/proof.jpg',
        visibility: 'PRIVATE',
        originalName: 'bien-lai-ung-ho-101.jpg',
        mimeType: 'image/jpeg',
        fileSize: 82000n,
        extension: 'jpg',
        publicUrl: null,
        uploadedByManagerId: null,
        uploadedByStudentId: 'student-1',
    },
    {
        id: 'file-certificate-source-1',
        bucketName: 'private-files',
        storageKey: 'certificates/templates/tpl-1/source.html',
        visibility: 'PRIVATE',
        originalName: 'tpl-1.html',
        mimeType: 'text/html',
        fileSize: 5000n,
        extension: 'html',
        publicUrl: null,
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-certificate-bg-1',
        bucketName: 'public-assets',
        storageKey: 'certificates/templates/tpl-1/background.png',
        visibility: 'PUBLIC',
        originalName: 'bg-chung-nhan-tinh-nguyen.png',
        mimeType: 'image/png',
        fileSize: 152000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/certificates/templates/tpl-1/background.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-certificate-bg-2',
        bucketName: 'public-assets',
        storageKey: 'certificates/templates/tpl-2/background.png',
        visibility: 'PUBLIC',
        originalName: 'bg-chung-nhan-tai-tro.png',
        mimeType: 'image/png',
        fileSize: 143000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/certificates/templates/tpl-2/background.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-certificate-bg-3',
        bucketName: 'public-assets',
        storageKey: 'certificates/templates/tpl-3/background.png',
        visibility: 'PUBLIC',
        originalName: 'bg-chung-nhan-hoan-thanh.png',
        mimeType: 'image/png',
        fileSize: 148000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/certificates/templates/tpl-3/background.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-signature-asset-1',
        bucketName: 'public-assets',
        storageKey: 'certificates/signatures/doan-truong.png',
        visibility: 'PUBLIC',
        originalName: 'chu-ky-doan-truong.png',
        mimeType: 'image/png',
        fileSize: 18000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/certificates/signatures/doan-truong.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-certificate-signed-1',
        bucketName: 'private-files',
        storageKey: 'certificates/generated/cert-1-signed.pdf',
        visibility: 'PRIVATE',
        originalName: 'chung-nhan-cert-1-signed.pdf',
        mimeType: 'application/pdf',
        fileSize: 288000n,
        extension: 'pdf',
        publicUrl: null,
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
    {
        id: 'file-certificate-preview-1',
        bucketName: 'public-assets',
        storageKey: 'certificates/generated/cert-1-preview.png',
        visibility: 'PUBLIC',
        originalName: 'chung-nhan-cert-1-preview.png',
        mimeType: 'image/png',
        fileSize: 128000n,
        extension: 'png',
        publicUrl:
            'https://storage.local/public-assets/certificates/generated/cert-1-preview.png',
        uploadedByManagerId: 'manager-board',
        uploadedByStudentId: null,
    },
] as const

const campaignSeeds = [
    {
        id: 'campaign-1',
        title: 'Xuân Yêu Thương 2026',
        organizerManagerId: 'manager-board',
        organizerType: 'DOANTRUONG',
        facultyCode: null,
        clubId: null,
        shortDescription: 'Mang Tết ấm áp đến sinh viên và người dân khó khăn.',
        overallObjective:
            'Gây quỹ, tổ chức hoạt động tình nguyện và trao quà Tết tại các khu trọ sinh viên.',
        beneficiaryDescription:
            'Sinh viên khó khăn và hộ dân có hoàn cảnh đặc biệt tại Đà Nẵng.',
        coverFileId: 'file-campaign-cover-1',
        logoFileId: 'file-campaign-logo-1',
        campaignStartAt: date('2026-01-05T07:00:00.000Z'),
        campaignEndAt: date('2026-02-05T15:00:00.000Z'),
        participationScopeType: 'SCHOOL_WIDE',
        status: 'ONGOING',
        submittedAt: date('2025-12-20T03:00:00.000Z'),
        publishedAt: date('2025-12-28T03:00:00.000Z'),
        endedAt: null,
    },
    {
        id: 'campaign-2',
        title: 'Áo Ấm Cho Em Vùng Cao',
        organizerManagerId: 'manager-clb-1',
        organizerType: 'CLB',
        facultyCode: '102',
        clubId: 'club-1',
        shortDescription: 'Kêu gọi áo ấm, balo, sách vở cho học sinh vùng cao.',
        overallObjective:
            'Quyên góp hiện vật và xây dựng đội hình vận chuyển, phân loại quà tặng.',
        beneficiaryDescription: 'Học sinh tiểu học tại huyện Nam Trà My.',
        coverFileId: 'file-campaign-cover-2',
        logoFileId: null,
        campaignStartAt: date('2026-09-01T01:00:00.000Z'),
        campaignEndAt: date('2026-10-15T11:00:00.000Z'),
        participationScopeType: 'CLUB_INTERNAL',
        status: 'SUBMITTED',
        submittedAt: date('2026-08-20T03:00:00.000Z'),
        publishedAt: null,
        endedAt: null,
    },
    {
        id: 'campaign-3',
        title: 'Tiếp Sức Mùa Thi 2026',
        organizerManagerId: 'manager-lcd-1',
        organizerType: 'LCD',
        facultyCode: '102',
        clubId: null,
        shortDescription:
            'Hỗ trợ thí sinh và phụ huynh trong kỳ thi tuyển sinh.',
        overallObjective:
            'Tổ chức đội hình hỗ trợ tại các điểm thi và gây quỹ học bổng đồng hành.',
        beneficiaryDescription:
            'Thí sinh và phụ huynh tại các điểm thi trên địa bàn thành phố.',
        coverFileId: 'file-campaign-cover-3',
        logoFileId: null,
        campaignStartAt: date('2026-06-20T00:00:00.000Z'),
        campaignEndAt: date('2026-07-20T12:00:00.000Z'),
        participationScopeType: 'FACULTY_INTERNAL',
        status: 'PUBLISHED',
        submittedAt: date('2026-05-25T02:00:00.000Z'),
        publishedAt: date('2026-06-01T02:00:00.000Z'),
        endedAt: null,
    },
    {
        id: 'campaign-4',
        title: 'Ngày Hội Hiến Máu Nhân Ái',
        organizerManagerId: 'manager-clb-3',
        organizerType: 'CLB',
        facultyCode: '105',
        clubId: 'club-3',
        shortDescription:
            'Ngày hội hiến máu kết hợp tuyên truyền sức khỏe cộng đồng.',
        overallObjective:
            'Vận động hiến máu, điều phối tình nguyện viên và truyền thông an toàn hiến máu.',
        beneficiaryDescription:
            'Ngân hàng máu sống và bệnh nhân cần truyền máu.',
        coverFileId: null,
        logoFileId: null,
        campaignStartAt: date('2026-03-10T00:00:00.000Z'),
        campaignEndAt: date('2026-03-30T12:00:00.000Z'),
        participationScopeType: 'SCHOOL_WIDE',
        status: 'APPROVED',
        submittedAt: date('2026-02-25T02:00:00.000Z'),
        publishedAt: null,
        endedAt: null,
    },
    {
        id: 'campaign-5',
        title: 'Gây Quỹ Hỗ Trợ Sinh Viên Khó Khăn',
        organizerManagerId: 'manager-board',
        organizerType: 'DOANTRUONG',
        facultyCode: null,
        clubId: null,
        shortDescription:
            'Chiến dịch gây quỹ học bổng và hỗ trợ khẩn cấp cho sinh viên khó khăn.',
        overallObjective:
            'Kết nối nhà tài trợ, quỹ cựu sinh viên và nguồn lực xã hội để hỗ trợ đúng đối tượng.',
        beneficiaryDescription:
            'Sinh viên có hoàn cảnh đặc biệt khó khăn trong toàn trường.',
        coverFileId: null,
        logoFileId: null,
        campaignStartAt: date('2026-08-05T00:00:00.000Z'),
        campaignEndAt: date('2026-11-30T12:00:00.000Z'),
        participationScopeType: 'SCHOOL_WIDE',
        status: 'DRAFT',
        submittedAt: null,
        publishedAt: null,
        endedAt: null,
    },
    {
        id: 'campaign-6',
        title: 'Mùa Hè Xanh Công Trình Sinh Viên',
        organizerManagerId: 'manager-lcd-2',
        organizerType: 'LCD',
        facultyCode: '105',
        clubId: null,
        shortDescription:
            'Tổ chức đội hình tình nguyện sửa chữa, sơn mới các điểm trường vùng ven.',
        overallObjective:
            'Phối hợp chuyên môn kỹ thuật, gây quỹ vật tư và tổ chức lao động cộng đồng.',
        beneficiaryDescription:
            'Các trường học và điểm sinh hoạt cộng đồng vùng ven.',
        coverFileId: null,
        logoFileId: null,
        campaignStartAt: date('2025-06-01T00:00:00.000Z'),
        campaignEndAt: date('2025-08-01T12:00:00.000Z'),
        participationScopeType: 'SCHOOL_WIDE',
        status: 'ENDED',
        submittedAt: date('2025-05-05T02:00:00.000Z'),
        publishedAt: date('2025-05-15T02:00:00.000Z'),
        endedAt: date('2025-08-02T00:00:00.000Z'),
    },
] as const

const moduleSeeds = [
    {
        id: 'module-volunteer-1',
        campaignId: 'campaign-1',
        moduleType: 'VOLUNTEER_RECRUITMENT',
        title: 'Đội hình gói quà và hậu cần Tết',
        shortDescription:
            'Tuyển tình nguyện viên chuẩn bị quà Tết và hậu cần chương trình.',
        displayOrder: 1,
        moduleStartAt: date('2026-01-05T07:00:00.000Z'),
        moduleEndAt: date('2026-01-20T11:00:00.000Z'),
        registrationStartAt: date('2025-12-20T00:00:00.000Z'),
        registrationEndAt: date('2026-01-10T12:00:00.000Z'),
        status: 'ACTIVE',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-fundraising-1',
        campaignId: 'campaign-1',
        moduleType: 'FUNDRAISING_MONEY',
        title: 'Quỹ quà Tết sẻ chia',
        shortDescription:
            'Gây quỹ tiền mặt để chuẩn bị quà Tết cho sinh viên khó khăn.',
        displayOrder: 2,
        moduleStartAt: date('2025-12-20T00:00:00.000Z'),
        moduleEndAt: date('2026-01-25T12:00:00.000Z'),
        registrationStartAt: null,
        registrationEndAt: null,
        status: 'ACTIVE',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-event-1',
        campaignId: 'campaign-1',
        moduleType: 'EVENT',
        title: 'Ngày hội trao quà Xuân',
        shortDescription: 'Sự kiện tổng kết và trao quà Xuân Yêu Thương 2026.',
        displayOrder: 3,
        moduleStartAt: date('2026-01-28T00:00:00.000Z'),
        moduleEndAt: date('2026-01-28T11:30:00.000Z'),
        registrationStartAt: date('2026-01-15T00:00:00.000Z'),
        registrationEndAt: date('2026-01-27T12:00:00.000Z'),
        status: 'READY',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-item-2',
        campaignId: 'campaign-2',
        moduleType: 'ITEM_DONATION',
        title: 'Tiếp nhận áo ấm và sách vở',
        shortDescription: 'Thu nhận hiện vật tại các điểm tập kết của trường.',
        displayOrder: 1,
        moduleStartAt: date('2026-09-01T00:00:00.000Z'),
        moduleEndAt: date('2026-10-05T12:00:00.000Z'),
        registrationStartAt: date('2026-08-25T00:00:00.000Z'),
        registrationEndAt: date('2026-09-25T12:00:00.000Z'),
        status: 'READY',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-volunteer-2',
        campaignId: 'campaign-2',
        moduleType: 'VOLUNTEER_RECRUITMENT',
        title: 'Đội hình phân loại quà tặng',
        shortDescription: 'Huy động sinh viên phân loại và đóng gói quà.',
        displayOrder: 2,
        moduleStartAt: date('2026-09-05T00:00:00.000Z'),
        moduleEndAt: date('2026-10-10T12:00:00.000Z'),
        registrationStartAt: date('2026-08-25T00:00:00.000Z'),
        registrationEndAt: date('2026-09-15T12:00:00.000Z'),
        status: 'DRAFT',
        visibilityStatus: 'INTERNAL',
    },
    {
        id: 'module-fundraising-2',
        campaignId: 'campaign-3',
        moduleType: 'FUNDRAISING_MONEY',
        title: 'Quỹ đồng hành tiếp sức mùa thi',
        shortDescription:
            'Gây quỹ hỗ trợ nước uống, bản đồ và học bổng khẩn cấp.',
        displayOrder: 1,
        moduleStartAt: date('2026-06-01T00:00:00.000Z'),
        moduleEndAt: date('2026-07-20T12:00:00.000Z'),
        registrationStartAt: null,
        registrationEndAt: null,
        status: 'ACTIVE',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-event-3',
        campaignId: 'campaign-3',
        moduleType: 'EVENT',
        title: 'Trực điểm thi và hỗ trợ thí sinh',
        shortDescription:
            'Sự kiện điều phối tình nguyện viên tại các điểm thi trọng điểm.',
        displayOrder: 2,
        moduleStartAt: date('2026-06-25T23:00:00.000Z'),
        moduleEndAt: date('2026-07-03T12:00:00.000Z'),
        registrationStartAt: date('2026-06-01T00:00:00.000Z'),
        registrationEndAt: date('2026-06-20T12:00:00.000Z'),
        status: 'ACTIVE',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-event-4',
        campaignId: 'campaign-4',
        moduleType: 'EVENT',
        title: 'Ngày hội hiến máu tập trung',
        shortDescription:
            'Sự kiện chính tiếp nhận hiến máu và tư vấn sức khỏe.',
        displayOrder: 1,
        moduleStartAt: date('2026-03-20T00:00:00.000Z'),
        moduleEndAt: date('2026-03-20T10:00:00.000Z'),
        registrationStartAt: date('2026-03-01T00:00:00.000Z'),
        registrationEndAt: date('2026-03-18T12:00:00.000Z'),
        status: 'READY',
        visibilityStatus: 'PUBLIC',
    },
    {
        id: 'module-fundraising-5',
        campaignId: 'campaign-5',
        moduleType: 'FUNDRAISING_MONEY',
        title: 'Quỹ học bổng vượt khó',
        shortDescription:
            'Kết nối cựu sinh viên và doanh nghiệp để gây quỹ học bổng.',
        displayOrder: 1,
        moduleStartAt: date('2026-08-15T00:00:00.000Z'),
        moduleEndAt: date('2026-11-30T12:00:00.000Z'),
        registrationStartAt: null,
        registrationEndAt: null,
        status: 'DRAFT',
        visibilityStatus: 'INTERNAL',
    },
    {
        id: 'module-volunteer-6',
        campaignId: 'campaign-6',
        moduleType: 'VOLUNTEER_RECRUITMENT',
        title: 'Đội hình cải tạo điểm trường',
        shortDescription:
            'Tình nguyện viên tham gia sửa chữa, sơn mới điểm trường.',
        displayOrder: 1,
        moduleStartAt: date('2025-06-10T00:00:00.000Z'),
        moduleEndAt: date('2025-07-25T12:00:00.000Z'),
        registrationStartAt: date('2025-05-10T00:00:00.000Z'),
        registrationEndAt: date('2025-05-30T12:00:00.000Z'),
        status: 'ENDED',
        visibilityStatus: 'PUBLIC',
    },
] as const

const clearRuntimeData = async (prisma: PrismaClient) => {
    await prisma.managerNotification.deleteMany()
    await prisma.studentNotification.deleteMany()
    await prisma.certificateDigitalSignature.deleteMany()
    await prisma.certificateSigningProfile.deleteMany()
    await prisma.certificateVerificationLog.deleteMany()
    await prisma.certificateAuditLog.deleteMany()
    await prisma.certificateRenderJob.deleteMany()
    await prisma.certificateSnapshot.deleteMany()
    await prisma.certificate.deleteMany()
    await prisma.certificateIssuancePolicy.deleteMany()
    await prisma.certificateTemplateVersion.deleteMany()
    await prisma.certificateTemplate.deleteMany()
    await prisma.itemContributionLine.deleteMany()
    await prisma.itemContribution.deleteMany()
    await prisma.moneyContributionTransaction.deleteMany()
    await prisma.moneyContribution.deleteMany()
    await prisma.checkin.deleteMany()
    await prisma.moduleRegistration.deleteMany()
    await prisma.itemDonationTarget.deleteMany()
    await prisma.itemDonationModuleConfig.deleteMany()
    await prisma.fundraisingModuleConfig.deleteMany()
    await prisma.volunteerModuleConfig.deleteMany()
    await prisma.eventModuleConfig.deleteMany()
    await prisma.campaignMedia.deleteMany()
    await prisma.campaignStatusHistory.deleteMany()
    await prisma.campaignReviewComment.deleteMany()
    await prisma.campaignReviewRequest.deleteMany()
    await prisma.campaignDocument.deleteMany()
    await prisma.tag.deleteMany()
    await prisma.campaignModule.deleteMany()
    await prisma.paymentProviderConfig.deleteMany()
    await prisma.organizerPaymentAccount.deleteMany()
    await prisma.clubMembership.deleteMany()
    await prisma.studentTitle.deleteMany()
    await prisma.title.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.club.deleteMany()
    await prisma.managerAccount.deleteMany()
    await prisma.student.deleteMany()
    await prisma.userOAuthAccount.deleteMany()
    await prisma.userRefreshToken.deleteMany()
    await prisma.userResetToken.deleteMany()
    await prisma.userEmailVerificationToken.deleteMany()
    await prisma.user.deleteMany()
    await prisma.file.deleteMany()
}

export async function seedRuntimeData(prisma: PrismaClient): Promise<void> {
    console.log('Seeding runtime database...')

    await clearRuntimeData(prisma)

    const facultyMap = new Map(
        (
            await prisma.faculty.findMany({ select: { id: true, code: true } })
        ).map((item) => [item.code, item.id])
    )

    const passwordHash = await argon2.hash('12345678', {
        type: argon2.argon2id,
        timeCost: 1,
        memoryCost: 1024,
        parallelism: 1,
    })

    const managerUsers = [
        {
            id: 'board-user',
            username: 'doantruong',
            email: 'doantruong@bkvolunteers.vn',
            role: 'DOANTRUONG',
            status: 'ACTIVE',
        },
        ...lcdFacultyCodes.map((facultyCode, index) => ({
            id:
                index === 0
                    ? 'lcd-user'
                    : `lcd-user-${String(index + 1).padStart(2, '0')}`,
            username:
                index === 0 ? 'lcd-cntt' : `lcd-${facultyCode.toLowerCase()}`,
            email:
                index === 0
                    ? 'lcd-cntt@bkvolunteers.vn'
                    : `lcd-${facultyCode}@bkvolunteers.vn`,
            role: 'LCD',
            status: 'ACTIVE',
        })),
        ...clubSeeds.map((club, index) => ({
            id: club.userId,
            username: index === 0 ? 'clb-tinh-nguyen-cntt' : `clb-${index + 1}`,
            email: `${club.userId}@bkvolunteers.vn`,
            role: 'CLB',
            status: 'ACTIVE',
        })),
    ]

    const studentUsers = studentSeeds.map((student) => ({
        id: student.userId,
        username: student.mssv,
        email: `${student.mssv}@sv1.dut.udn.vn`,
        role: 'SINHVIEN',
        status: 'ACTIVE',
    }))

    await prisma.user.createMany({
        data: [...managerUsers, ...studentUsers].map((user) => ({
            ...user,
            passwordHash,
            role: user.role as never,
            status: user.status as never,
        })),
    })

    await prisma.student.createMany({
        data: studentSeeds.map((student) => ({
            id: student.studentId,
            userId: student.userId,
            mssv: student.mssv,
            fullName: student.fullName,
            facultyId: facultyMap.get(student.facultyCode)!,
            className: student.className,
            phone: student.phone,
            totalPoints: student.totalPoints,
        })),
    })

    await prisma.managerAccount.create({
        data: {
            id: 'manager-board',
            userId: 'board-user',
        },
    })

    for (const [index, facultyCode] of lcdFacultyCodes.entries()) {
        await prisma.managerAccount.create({
            data: {
                id: index === 0 ? 'manager-lcd-1' : `manager-lcd-${index + 1}`,
                userId:
                    index === 0
                        ? 'lcd-user'
                        : `lcd-user-${String(index + 1).padStart(2, '0')}`,
                facultyId: facultyMap.get(facultyCode)!,
            },
        })
    }

    for (const club of clubSeeds) {
        await prisma.managerAccount.create({
            data: {
                id: club.managerId,
                userId: club.userId,
                facultyId: facultyMap.get(club.facultyCode)!,
            },
        })
    }

    await prisma.club.createMany({
        data: clubSeeds.map((club) => ({
            id: club.id,
            name: club.name,
            facultyId: facultyMap.get(club.facultyCode)!,
            leaderManagerId: club.managerId,
            isSchoolLevel: club.isSchoolLevel,
            status: 'ACTIVE',
        })),
    })

    for (const club of clubSeeds) {
        await prisma.managerAccount.update({
            where: {
                id: club.managerId,
            },
            data: {
                managedClubId: club.id,
            },
        })
    }

    await prisma.file.createMany({
        data: seedFiles.map((file) => ({
            ...file,
            checksumSha256: null,
        })),
    })

    await prisma.user.update({
        where: { id: 'board-user' },
        data: { avatarFileId: 'file-avatar-board' },
    })
    await prisma.user.update({
        where: { id: 'student-user' },
        data: { avatarFileId: 'file-avatar-student-1' },
    })

    await prisma.title.createMany({
        data: [
            {
                id: 1,
                name: 'Tình nguyện viên mới',
                description:
                    'Dành cho sinh viên bắt đầu tham gia hoạt động cộng đồng.',
                minPoints: 50,
                iconUrl:
                    'https://storage.local/public-assets/titles/tinh-nguyen-vien-moi.png',
            },
            {
                id: 2,
                name: 'Người lan tỏa yêu thương',
                description:
                    'Ghi nhận những đóng góp đều đặn cho chiến dịch thiện nguyện.',
                minPoints: 100,
                iconUrl:
                    'https://storage.local/public-assets/titles/nguoi-lan-toa-yeu-thuong.png',
            },
            {
                id: 3,
                name: 'Chiến binh cộng đồng',
                description:
                    'Dành cho sinh viên tham gia nhiều chiến dịch và có giờ công nổi bật.',
                minPoints: 180,
                iconUrl:
                    'https://storage.local/public-assets/titles/chien-binh-cong-dong.png',
            },
            {
                id: 4,
                name: 'Đại sứ thiện nguyện',
                description:
                    'Danh hiệu cao cho sinh viên dẫn dắt và truyền cảm hứng hoạt động vì cộng đồng.',
                minPoints: 230,
                iconUrl:
                    'https://storage.local/public-assets/titles/dai-su-thien-nguyen.png',
            },
        ],
    })

    await prisma.studentTitle.createMany({
        data: [
            {
                studentId: 'student-1',
                titleId: 3,
                unlockedAt: date('2026-01-10T00:00:00.000Z'),
            },
            {
                studentId: 'student-4',
                titleId: 4,
                unlockedAt: date('2026-01-12T00:00:00.000Z'),
            },
            {
                studentId: 'student-6',
                titleId: 4,
                unlockedAt: date('2026-01-15T00:00:00.000Z'),
            },
            {
                studentId: 'student-2',
                titleId: 2,
                unlockedAt: date('2026-01-08T00:00:00.000Z'),
            },
        ],
    })

    await prisma.clubMembership.createMany({
        data: [
            {
                id: 'membership-1',
                clubId: 'club-1',
                studentId: 'student-1',
                status: 'APPROVED',
                note: 'Thành viên nòng cốt hỗ trợ truyền thông.',
                joinedAt: date('2025-09-01T00:00:00.000Z'),
                approvedAt: date('2025-09-03T00:00:00.000Z'),
                approvedById: 'manager-clb-1',
            },
            {
                id: 'membership-2',
                clubId: 'club-2',
                studentId: 'student-2',
                status: 'PENDING',
                note: 'Đăng ký tham gia ban hậu cần.',
                joinedAt: date('2025-09-10T00:00:00.000Z'),
                approvedAt: null,
                approvedById: null,
            },
            {
                id: 'membership-3',
                clubId: 'club-3',
                studentId: 'student-3',
                status: 'REJECTED',
                note: 'Cần cập nhật lịch học trước khi tham gia.',
                joinedAt: date('2025-09-05T00:00:00.000Z'),
                approvedAt: date('2025-09-07T00:00:00.000Z'),
                approvedById: 'manager-clb-3',
            },
            {
                id: 'membership-4',
                clubId: 'club-5',
                studentId: 'student-4',
                status: 'APPROVED',
                note: 'Hỗ trợ điều phối kỹ năng mềm.',
                joinedAt: date('2025-10-01T00:00:00.000Z'),
                approvedAt: date('2025-10-02T00:00:00.000Z'),
                approvedById: 'manager-clb-5',
            },
        ],
    })

    await prisma.organizerPaymentAccount.createMany({
        data: [
            {
                id: 'payment-board-1',
                ownerType: 'DOANTRUONG',
                ownerManagerAccountId: 'manager-board',
                ownerFacultyId: null,
                ownerClubId: null,
                displayName: 'Tài khoản nhận quỹ Đoàn trường',
                bankName: 'MB Bank',
                accountNumber: '9704220000000001',
                accountHolderName: 'Đoàn trường Bách Khoa',
                branchName: 'Đà Nẵng',
                isDefault: true,
                verificationStatus: 'ACTIVE',
                paymentMethodType: 'MANUAL_TRANSFER',
            },
            {
                id: 'payment-lcd-1',
                ownerType: 'LCD',
                ownerManagerAccountId: 'manager-lcd-1',
                ownerFacultyId: facultyMap.get('102')!,
                ownerClubId: null,
                displayName: 'Tài khoản tiếp sức CNTT',
                bankName: 'Vietcombank',
                accountNumber: '9704360000000002',
                accountHolderName: 'Liên chi đoàn CNTT',
                branchName: 'Hải Châu',
                isDefault: true,
                verificationStatus: 'ACTIVE',
                paymentMethodType: 'PAYOS',
            },
            {
                id: 'payment-club-1',
                ownerType: 'CLB',
                ownerManagerAccountId: 'manager-clb-1',
                ownerFacultyId: facultyMap.get('102')!,
                ownerClubId: 'club-1',
                displayName: 'Tài khoản CLB Tình nguyện CNTT',
                bankName: 'ACB',
                accountNumber: '9704160000000003',
                accountHolderName: 'CLB Tình nguyện CNTT',
                branchName: 'Thanh Khê',
                isDefault: true,
                verificationStatus: 'ACTIVE',
                paymentMethodType: 'MANUAL_TRANSFER',
            },
            {
                id: 'payment-club-3',
                ownerType: 'CLB',
                ownerManagerAccountId: 'manager-clb-3',
                ownerFacultyId: facultyMap.get('105')!,
                ownerClubId: 'club-3',
                displayName: 'Tài khoản CLB Hiến máu Nhân Ái',
                bankName: 'BIDV',
                accountNumber: '9704180000000004',
                accountHolderName: 'CLB Hiến máu Nhân Ái',
                branchName: 'Sông Hàn',
                isDefault: true,
                verificationStatus: 'ACTIVE',
                paymentMethodType: 'PAYOS',
            },
        ],
    })

    await prisma.paymentProviderConfig.createMany({
        data: [
            {
                id: 'provider-payment-lcd-1',
                organizerPaymentAccountId: 'payment-lcd-1',
                providerName: 'PAYOS',
                merchantCode: 'MERCHANT-LCD-CNTT',
                clientId: 'CLIENT-LCD-CNTT',
                apiKeyEncrypted: 'encrypted-demo-api-key',
                checksumKeyEncrypted: 'encrypted-demo-checksum',
                webhookUrl:
                    'https://api.bkvolunteers.vn/webhooks/payos/lcd-cntt',
                isActive: true,
                lastVerifiedAt: date('2026-05-20T00:00:00.000Z'),
            },
            {
                id: 'provider-payment-club-3',
                organizerPaymentAccountId: 'payment-club-3',
                providerName: 'PAYOS',
                merchantCode: 'MERCHANT-CLB-HIENMAU',
                clientId: 'CLIENT-CLB-HIENMAU',
                apiKeyEncrypted: 'encrypted-demo-api-key-2',
                checksumKeyEncrypted: 'encrypted-demo-checksum-2',
                webhookUrl:
                    'https://api.bkvolunteers.vn/webhooks/payos/clb-hien-mau',
                isActive: true,
                lastVerifiedAt: date('2026-03-01T00:00:00.000Z'),
            },
        ],
    })

    await prisma.campaign.createMany({
        data: campaignSeeds.map((campaign) => ({
            id: campaign.id,
            title: campaign.title,
            organizerManagerId: campaign.organizerManagerId,
            organizerType: campaign.organizerType,
            facultyId: campaign.facultyCode
                ? facultyMap.get(campaign.facultyCode)!
                : null,
            clubId: campaign.clubId,
            shortDescription: campaign.shortDescription,
            overallObjective: campaign.overallObjective,
            beneficiaryDescription: campaign.beneficiaryDescription,
            coverFileId: campaign.coverFileId,
            logoFileId: campaign.logoFileId,
            campaignStartAt: campaign.campaignStartAt,
            campaignEndAt: campaign.campaignEndAt,
            participationScopeType: campaign.participationScopeType,
            status: campaign.status,
            submittedAt: campaign.submittedAt,
            publishedAt: campaign.publishedAt,
            endedAt: campaign.endedAt,
        })),
    })

    await prisma.tag.createMany({
        data: [
            {
                id: 'tag-1',
                campaignId: 'campaign-1',
                name: 'Tết sẻ chia',
                color: '#DC2626',
            },
            {
                id: 'tag-2',
                campaignId: 'campaign-1',
                name: 'Hỗ trợ sinh viên',
                color: '#F59E0B',
            },
            {
                id: 'tag-3',
                campaignId: 'campaign-2',
                name: 'Áo ấm',
                color: '#2563EB',
            },
            {
                id: 'tag-4',
                campaignId: 'campaign-3',
                name: 'Kỳ thi',
                color: '#16A34A',
            },
            {
                id: 'tag-5',
                campaignId: 'campaign-4',
                name: 'Hiến máu',
                color: '#EF4444',
            },
            {
                id: 'tag-6',
                campaignId: 'campaign-5',
                name: 'Học bổng',
                color: '#7C3AED',
            },
        ],
    })

    await prisma.campaignModule.createMany({
        data: moduleSeeds.map((module) => ({ ...module })),
    })

    await prisma.volunteerModuleConfig.createMany({
        data: [
            {
                moduleId: 'module-volunteer-1',
                jobDescription:
                    'Gói quà, chuẩn bị hậu cần và hỗ trợ truyền thông tại điểm trao quà.',
                requiredQuantity: 40,
                requirementsText:
                    'Nhiệt tình, đúng giờ, ưu tiên từng tham gia chiến dịch cộng đồng.',
                activityLocation: 'Nhà Văn hóa Sinh viên Bách Khoa',
                participationScopeOverride: 'SCHOOL_WIDE',
                autoCertificateEnabled: true,
                checkinRequired: true,
            },
            {
                moduleId: 'module-volunteer-2',
                jobDescription: 'Phân loại quà và lên danh sách đóng gói.',
                requiredQuantity: 25,
                requirementsText: 'Có thể tham gia tối thiểu 3 buổi phân loại.',
                activityLocation: 'Kho CLB Tình nguyện CNTT',
                participationScopeOverride: 'CLUB_MEMBERS_ONLY',
                autoCertificateEnabled: false,
                checkinRequired: true,
            },
            {
                moduleId: 'module-volunteer-6',
                jobDescription:
                    'Sơn sửa, lắp đặt bảng tin và dọn vệ sinh điểm trường.',
                requiredQuantity: 60,
                requirementsText:
                    'Có sức khỏe tốt, ưu tiên sinh viên khối kỹ thuật.',
                activityLocation: 'Hòa Bắc, Đà Nẵng',
                participationScopeOverride: 'SCHOOL_WIDE',
                autoCertificateEnabled: true,
                checkinRequired: true,
            },
        ],
    })

    await prisma.fundraisingModuleConfig.createMany({
        data: [
            {
                moduleId: 'module-fundraising-1',
                fundraisingGoalAmount: 50000000,
                minimumContributionAmount: 50000,
                paymentMethodType: 'MANUAL_TRANSFER',
                organizerPaymentAccountId: 'payment-board-1',
                qrFileId: null,
                displayPublicProgress: true,
                allowAnonymousPublicDisplay: false,
            },
            {
                moduleId: 'module-fundraising-2',
                fundraisingGoalAmount: 50000000,
                minimumContributionAmount: 50000,
                paymentMethodType: 'PAYOS',
                organizerPaymentAccountId: 'payment-lcd-1',
                qrFileId: 'file-qr-fundraising-2',
                displayPublicProgress: true,
                allowAnonymousPublicDisplay: false,
            },
            {
                moduleId: 'module-fundraising-5',
                fundraisingGoalAmount: 80000000,
                minimumContributionAmount: 100000,
                paymentMethodType: 'MANUAL_TRANSFER',
                organizerPaymentAccountId: 'payment-board-1',
                qrFileId: null,
                displayPublicProgress: true,
                allowAnonymousPublicDisplay: false,
            },
        ],
    })

    await prisma.itemDonationModuleConfig.createMany({
        data: [
            {
                moduleId: 'module-item-2',
                receiveLocation: 'Sảnh nhà A5, Đại học Bách khoa',
                receiverContactName: 'Nguyễn Minh Phúc',
                receiverContactPhone: '0905111222',
                handoverConfirmationMethod: 'MANUAL_CONFIRM',
                allowPreRegistration: true,
            },
        ],
    })

    await prisma.itemDonationTarget.createMany({
        data: [
            {
                id: 'target-item-1',
                moduleId: 'module-item-2',
                itemName: 'Sách giáo khoa',
                unitName: 'quyển',
                targetQuantity: 500,
                qualityDescription: 'Còn sử dụng tốt, sạch, đầy đủ trang.',
                notes: 'Ưu tiên sách lớp 1 đến lớp 5.',
            },
            {
                id: 'target-item-2',
                moduleId: 'module-item-2',
                itemName: 'Áo ấm',
                unitName: 'chiếc',
                targetQuantity: 300,
                qualityDescription: 'Sạch, lành lặn, phù hợp trẻ em vùng cao.',
                notes: 'Đã giặt sạch trước khi trao tặng.',
            },
            {
                id: 'target-item-3',
                moduleId: 'module-item-2',
                itemName: 'Balo',
                unitName: 'cái',
                targetQuantity: 120,
                qualityDescription: 'Khóa kéo còn tốt, không rách.',
                notes: 'Ưu tiên balo tiểu học.',
            },
            {
                id: 'target-item-4',
                moduleId: 'module-item-2',
                itemName: 'Hộp sữa',
                unitName: 'hộp',
                targetQuantity: 1000,
                qualityDescription: 'Còn hạn sử dụng tối thiểu 4 tháng.',
                notes: 'Nhận theo thùng hoặc hộp lẻ.',
            },
        ],
    })

    await prisma.eventModuleConfig.createMany({
        data: [
            {
                moduleId: 'module-event-1',
                eventFormat: 'OFFLINE',
                eventLocation: 'Nhà Văn hóa Sinh viên Bách Khoa',
                maxAttendees: 300,
                eventAgenda:
                    'Trao quà, giao lưu văn nghệ và tổng kết chiến dịch.',
                checkinEnabled: true,
            },
            {
                moduleId: 'module-event-3',
                eventFormat: 'OFFLINE',
                eventLocation: 'Cụm điểm thi THPT tại Hải Châu và Thanh Khê',
                maxAttendees: 120,
                eventAgenda:
                    'Hỗ trợ tìm phòng thi, phát nước, hướng dẫn phụ huynh, phân luồng giao thông.',
                checkinEnabled: true,
            },
            {
                moduleId: 'module-event-4',
                eventFormat: 'HYBRID',
                eventLocation: 'Hội trường A và khu hiến máu lưu động',
                maxAttendees: 250,
                eventAgenda:
                    'Hiến máu tập trung, tuyên truyền sức khỏe và chăm sóc sau hiến.',
                checkinEnabled: true,
            },
        ],
    })

    await prisma.campaignDocument.createMany({
        data: [
            {
                id: 'campaign-doc-1',
                campaignId: 'campaign-1',
                fileId: 'file-doc-campaign-1',
                documentType: 'MASTER_PLAN',
                isPublic: false,
                uploadedById: 'manager-board',
            },
            {
                id: 'campaign-doc-2',
                campaignId: 'campaign-2',
                fileId: 'file-doc-campaign-2',
                documentType: 'BUDGET',
                isPublic: false,
                uploadedById: 'manager-clb-1',
            },
        ],
    })

    await prisma.campaignReviewRequest.createMany({
        data: [
            {
                id: 'review-req-1',
                campaignId: 'campaign-2',
                submittedById: 'manager-clb-1',
                submittedAt: date('2026-08-20T03:00:00.000Z'),
                reviewStatus: 'SUBMITTED',
                currentReviewerId: 'manager-board',
                reviewedAt: null,
            },
            {
                id: 'review-req-2',
                campaignId: 'campaign-4',
                submittedById: 'manager-clb-3',
                submittedAt: date('2026-02-25T02:00:00.000Z'),
                reviewStatus: 'FINAL_APPROVED',
                currentReviewerId: 'manager-board',
                reviewedAt: date('2026-03-01T02:00:00.000Z'),
            },
        ],
    })

    await prisma.campaignReviewComment.createMany({
        data: [
            {
                id: 'review-comment-1',
                reviewRequestId: 'review-req-1',
                scopeType: 'CAMPAIGN',
                moduleId: null,
                documentId: null,
                commentText:
                    'Hồ sơ đã đủ thành phần, vui lòng bổ sung thêm ảnh minh họa điểm đến trước khi phê duyệt cuối.',
                authorId: 'manager-board',
            },
            {
                id: 'review-comment-2',
                reviewRequestId: 'review-req-1',
                scopeType: 'DOCUMENT',
                moduleId: null,
                documentId: 'campaign-doc-2',
                commentText:
                    'Cần làm rõ hạng mục chi cho vận chuyển áo ấm và bảo hiểm hàng hóa.',
                authorId: 'manager-board',
            },
            {
                id: 'review-comment-3',
                reviewRequestId: 'review-req-2',
                scopeType: 'CAMPAIGN',
                moduleId: null,
                documentId: null,
                commentText:
                    'Phê duyệt triển khai ngày hội hiến máu theo kế hoạch đã nộp.',
                authorId: 'manager-board',
            },
        ],
    })

    await prisma.campaignStatusHistory.createMany({
        data: [
            {
                id: 'status-1',
                campaignId: 'campaign-1',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-board',
                note: 'Khởi tạo chiến dịch',
            },
            {
                id: 'status-2',
                campaignId: 'campaign-1',
                fromStatus: 'DRAFT',
                toStatus: 'SUBMITTED',
                changedById: 'manager-board',
                note: 'Gửi duyệt kế hoạch Tết',
            },
            {
                id: 'status-3',
                campaignId: 'campaign-1',
                fromStatus: 'SUBMITTED',
                toStatus: 'APPROVED',
                changedById: 'manager-board',
                note: 'Đã duyệt triển khai',
            },
            {
                id: 'status-4',
                campaignId: 'campaign-1',
                fromStatus: 'APPROVED',
                toStatus: 'PUBLISHED',
                changedById: 'manager-board',
                note: 'Công khai chiến dịch đến sinh viên',
            },
            {
                id: 'status-5',
                campaignId: 'campaign-1',
                fromStatus: 'PUBLISHED',
                toStatus: 'ONGOING',
                changedById: 'manager-board',
                note: 'Chiến dịch đang diễn ra',
            },
            {
                id: 'status-6',
                campaignId: 'campaign-2',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-clb-1',
                note: 'Soạn thảo kế hoạch áo ấm',
            },
            {
                id: 'status-7',
                campaignId: 'campaign-2',
                fromStatus: 'DRAFT',
                toStatus: 'SUBMITTED',
                changedById: 'manager-clb-1',
                note: 'Gửi Đoàn trường duyệt chiến dịch',
            },
            {
                id: 'status-8',
                campaignId: 'campaign-3',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-lcd-1',
                note: 'Khởi tạo chiến dịch tiếp sức mùa thi',
            },
            {
                id: 'status-9',
                campaignId: 'campaign-3',
                fromStatus: 'DRAFT',
                toStatus: 'SUBMITTED',
                changedById: 'manager-lcd-1',
                note: 'Hoàn thiện hồ sơ và gửi duyệt',
            },
            {
                id: 'status-10',
                campaignId: 'campaign-3',
                fromStatus: 'SUBMITTED',
                toStatus: 'APPROVED',
                changedById: 'manager-board',
                note: 'Phê duyệt triển khai tiếp sức mùa thi',
            },
            {
                id: 'status-11',
                campaignId: 'campaign-3',
                fromStatus: 'APPROVED',
                toStatus: 'PUBLISHED',
                changedById: 'manager-lcd-1',
                note: 'Công khai cho sinh viên đăng ký',
            },
            {
                id: 'status-12',
                campaignId: 'campaign-4',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-clb-3',
                note: 'Tạo đề xuất ngày hội hiến máu',
            },
            {
                id: 'status-13',
                campaignId: 'campaign-4',
                fromStatus: 'DRAFT',
                toStatus: 'SUBMITTED',
                changedById: 'manager-clb-3',
                note: 'Gửi duyệt hồ sơ hiến máu',
            },
            {
                id: 'status-14',
                campaignId: 'campaign-4',
                fromStatus: 'SUBMITTED',
                toStatus: 'APPROVED',
                changedById: 'manager-board',
                note: 'Đồng ý triển khai chương trình',
            },
            {
                id: 'status-15',
                campaignId: 'campaign-5',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-board',
                note: 'Khởi tạo quỹ học bổng vượt khó',
            },
            {
                id: 'status-16',
                campaignId: 'campaign-6',
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: 'manager-lcd-2',
                note: 'Khởi tạo chiến dịch mùa hè xanh',
            },
            {
                id: 'status-17',
                campaignId: 'campaign-6',
                fromStatus: 'DRAFT',
                toStatus: 'SUBMITTED',
                changedById: 'manager-lcd-2',
                note: 'Gửi duyệt chiến dịch mùa hè xanh',
            },
            {
                id: 'status-18',
                campaignId: 'campaign-6',
                fromStatus: 'SUBMITTED',
                toStatus: 'APPROVED',
                changedById: 'manager-board',
                note: 'Phê duyệt chiến dịch',
            },
            {
                id: 'status-19',
                campaignId: 'campaign-6',
                fromStatus: 'APPROVED',
                toStatus: 'PUBLISHED',
                changedById: 'manager-lcd-2',
                note: 'Công khai chiêu mộ tình nguyện viên',
            },
            {
                id: 'status-20',
                campaignId: 'campaign-6',
                fromStatus: 'PUBLISHED',
                toStatus: 'ONGOING',
                changedById: 'manager-lcd-2',
                note: 'Bắt đầu thi công công trình sinh viên',
            },
            {
                id: 'status-21',
                campaignId: 'campaign-6',
                fromStatus: 'ONGOING',
                toStatus: 'ENDED',
                changedById: 'manager-lcd-2',
                note: 'Hoàn thành chiến dịch và bàn giao công trình',
            },
        ],
    })

    await prisma.campaignMedia.createMany({
        data: [
            {
                id: 'media-1',
                campaignId: 'campaign-1',
                moduleId: 'module-event-1',
                fileId: 'file-media-campaign-1',
                mediaType: 'GALLERY',
                caption:
                    'Không khí chuẩn bị quà Tết tại nhà văn hóa sinh viên.',
                isPublic: true,
                sortOrder: 1,
            },
            {
                id: 'media-2',
                campaignId: 'campaign-3',
                moduleId: 'module-event-3',
                fileId: 'file-media-campaign-3',
                mediaType: 'COVERAGE',
                caption: 'Tình nguyện viên hỗ trợ thí sinh tại cổng trường.',
                isPublic: true,
                sortOrder: 1,
            },
        ],
    })

    await prisma.moduleRegistration.createMany({
        data: [
            {
                id: 'registration-vol-1',
                moduleId: 'module-volunteer-1',
                studentId: 'student-1',
                registrationType: 'VOLUNTEER',
                status: 'COMPLETED',
                submittedAt: date('2025-12-22T00:00:00.000Z'),
                reviewedById: 'manager-board',
                reviewedAt: date('2025-12-24T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Hoàn thành hậu cần và hỗ trợ trao quà.',
            },
            {
                id: 'registration-vol-2',
                moduleId: 'module-volunteer-1',
                studentId: 'student-5',
                registrationType: 'VOLUNTEER',
                status: 'APPROVED',
                submittedAt: date('2025-12-23T00:00:00.000Z'),
                reviewedById: 'manager-board',
                reviewedAt: date('2025-12-25T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Sẵn sàng tham gia ca sáng.',
            },
            {
                id: 'registration-vol-3',
                moduleId: 'module-volunteer-2',
                studentId: 'student-6',
                registrationType: 'VOLUNTEER',
                status: 'REJECTED',
                submittedAt: date('2026-08-28T00:00:00.000Z'),
                reviewedById: 'manager-clb-1',
                reviewedAt: date('2026-08-29T00:00:00.000Z'),
                rejectionReason: 'Trùng lịch thực tập chuyên ngành.',
                completionNote: null,
            },
            {
                id: 'registration-vol-4',
                moduleId: 'module-volunteer-6',
                studentId: 'student-7',
                registrationType: 'VOLUNTEER',
                status: 'COMPLETED',
                submittedAt: date('2025-05-12T00:00:00.000Z'),
                reviewedById: 'manager-lcd-2',
                reviewedAt: date('2025-05-14T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Hoàn thành 2 ngày cải tạo điểm trường.',
            },
            {
                id: 'registration-vol-5',
                moduleId: 'module-volunteer-6',
                studentId: 'student-8',
                registrationType: 'VOLUNTEER',
                status: 'WAITLISTED',
                submittedAt: date('2025-05-15T00:00:00.000Z'),
                reviewedById: 'manager-lcd-2',
                reviewedAt: date('2025-05-17T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Chờ bố trí lượt tham gia bổ sung.',
            },
            {
                id: 'registration-evt-1',
                moduleId: 'module-event-1',
                studentId: 'student-9',
                registrationType: 'EVENT',
                status: 'COMPLETED',
                submittedAt: date('2026-01-20T00:00:00.000Z'),
                reviewedById: 'manager-board',
                reviewedAt: date('2026-01-22T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Hỗ trợ đón khách và dẫn chương trình.',
            },
            {
                id: 'registration-evt-2',
                moduleId: 'module-event-1',
                studentId: 'student-10',
                registrationType: 'EVENT',
                status: 'APPROVED',
                submittedAt: date('2026-01-21T00:00:00.000Z'),
                reviewedById: 'manager-board',
                reviewedAt: date('2026-01-23T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-evt-3',
                moduleId: 'module-event-3',
                studentId: 'student-1',
                registrationType: 'EVENT',
                status: 'PENDING',
                submittedAt: date('2026-06-05T00:00:00.000Z'),
                reviewedById: null,
                reviewedAt: null,
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-evt-4',
                moduleId: 'module-event-3',
                studentId: 'student-2',
                registrationType: 'EVENT',
                status: 'PENDING',
                submittedAt: date('2026-06-06T00:00:00.000Z'),
                reviewedById: null,
                reviewedAt: null,
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-evt-5',
                moduleId: 'module-event-3',
                studentId: 'student-3',
                registrationType: 'EVENT',
                status: 'COMPLETED',
                submittedAt: date('2026-06-04T00:00:00.000Z'),
                reviewedById: 'manager-lcd-1',
                reviewedAt: date('2026-06-08T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Hoàn thành 3 ca trực điểm thi.',
            },
            {
                id: 'registration-evt-6',
                moduleId: 'module-event-3',
                studentId: 'student-4',
                registrationType: 'EVENT',
                status: 'APPROVED',
                submittedAt: date('2026-06-07T00:00:00.000Z'),
                reviewedById: 'manager-lcd-1',
                reviewedAt: date('2026-06-09T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-evt-7',
                moduleId: 'module-event-4',
                studentId: 'student-5',
                registrationType: 'EVENT',
                status: 'APPROVED',
                submittedAt: date('2026-03-03T00:00:00.000Z'),
                reviewedById: 'manager-clb-3',
                reviewedAt: date('2026-03-05T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-item-1',
                moduleId: 'module-item-2',
                studentId: 'student-6',
                registrationType: 'ITEM_PRE_REGISTRATION',
                status: 'APPROVED',
                submittedAt: date('2026-08-26T00:00:00.000Z'),
                reviewedById: 'manager-clb-1',
                reviewedAt: date('2026-08-27T00:00:00.000Z'),
                rejectionReason: null,
                completionNote: 'Đăng ký mang sách và áo ấm.',
            },
            {
                id: 'registration-item-2',
                moduleId: 'module-item-2',
                studentId: 'student-7',
                registrationType: 'ITEM_PRE_REGISTRATION',
                status: 'PENDING',
                submittedAt: date('2026-08-27T00:00:00.000Z'),
                reviewedById: null,
                reviewedAt: null,
                rejectionReason: null,
                completionNote: null,
            },
            {
                id: 'registration-item-3',
                moduleId: 'module-item-2',
                studentId: 'student-8',
                registrationType: 'ITEM_PRE_REGISTRATION',
                status: 'REJECTED',
                submittedAt: date('2026-08-28T00:00:00.000Z'),
                reviewedById: 'manager-clb-1',
                reviewedAt: date('2026-08-29T00:00:00.000Z'),
                rejectionReason:
                    'Danh mục hiện vật chưa phù hợp với nhu cầu hiện tại.',
                completionNote: null,
            },
        ],
    })

    await prisma.checkin.createMany({
        data: [
            {
                id: 'checkin-1',
                registrationId: 'registration-vol-1',
                checkedById: 'manager-board',
                method: 'MANUAL',
                checkedInAt: date('2026-01-10T01:00:00.000Z'),
                checkedOutAt: date('2026-01-10T05:30:00.000Z'),
            },
            {
                id: 'checkin-2',
                registrationId: 'registration-vol-4',
                checkedById: 'manager-lcd-2',
                method: 'QR',
                checkedInAt: date('2025-06-20T01:00:00.000Z'),
                checkedOutAt: date('2025-06-20T09:30:00.000Z'),
            },
            {
                id: 'checkin-3',
                registrationId: 'registration-evt-1',
                checkedById: 'manager-board',
                method: 'QR',
                checkedInAt: date('2026-01-28T00:30:00.000Z'),
                checkedOutAt: date('2026-01-28T05:30:00.000Z'),
            },
            {
                id: 'checkin-4',
                registrationId: 'registration-evt-5',
                checkedById: 'manager-lcd-1',
                method: 'MANUAL',
                checkedInAt: date('2026-06-28T00:30:00.000Z'),
                checkedOutAt: date('2026-06-28T04:30:00.000Z'),
            },
        ],
    })

    await prisma.moneyContribution.createMany({
        data: [
            {
                id: 'donation-101',
                moduleId: 'module-fundraising-1',
                studentId: 'student-1',
                amount: 500000,
                contributionStatus: 'VERIFIED',
                paymentMethodType: 'MANUAL_TRANSFER',
                proofFileId: 'file-money-proof-1',
                paymentProviderTransactionId: 'tx-fund-101',
                verifiedById: 'manager-board',
                verifiedAt: date('2026-01-05T00:00:00.000Z'),
                rejectionReason: 'Ủng hộ chương trình quà Tết yêu thương',
                isPublicVisible: true,
            },
            {
                id: 'donation-102',
                moduleId: 'module-fundraising-1',
                studentId: 'student-2',
                amount: 200000,
                contributionStatus: 'PENDING',
                paymentMethodType: 'MANUAL_TRANSFER',
                proofFileId: null,
                paymentProviderTransactionId: null,
                verifiedById: null,
                verifiedAt: null,
                rejectionReason: 'Đồng hành quỹ quà Tết',
                isPublicVisible: true,
            },
            {
                id: 'donation-103',
                moduleId: 'module-fundraising-1',
                studentId: 'student-3',
                amount: 300000,
                contributionStatus: 'REJECTED',
                paymentMethodType: 'MANUAL_TRANSFER',
                proofFileId: null,
                paymentProviderTransactionId: null,
                verifiedById: 'manager-board',
                verifiedAt: date('2026-01-07T00:00:00.000Z'),
                rejectionReason:
                    'Biên lai chưa thể hiện rõ nội dung chuyển khoản.',
                isPublicVisible: false,
            },
            {
                id: 'donation-104',
                moduleId: 'module-fundraising-1',
                studentId: 'student-4',
                amount: 1000000,
                contributionStatus: 'VERIFIED',
                paymentMethodType: 'PAYOS',
                proofFileId: null,
                paymentProviderTransactionId: 'tx-fund-104',
                verifiedById: 'manager-board',
                verifiedAt: date('2026-01-08T00:00:00.000Z'),
                rejectionReason: 'Ủng hộ học bổng Tết',
                isPublicVisible: true,
            },
            {
                id: 'donation-201',
                moduleId: 'module-fundraising-2',
                studentId: 'student-1',
                amount: 450000,
                contributionStatus: 'PENDING',
                paymentMethodType: 'PAYOS',
                proofFileId: null,
                paymentProviderTransactionId: null,
                verifiedById: null,
                verifiedAt: null,
                rejectionReason: 'Ủng hộ học bổng đầu năm',
                isPublicVisible: true,
            },
            {
                id: 'donation-202',
                moduleId: 'module-fundraising-2',
                studentId: 'student-5',
                amount: 700000,
                contributionStatus: 'VERIFIED',
                paymentMethodType: 'PAYOS',
                proofFileId: null,
                paymentProviderTransactionId: 'tx-fund-202',
                verifiedById: 'manager-lcd-1',
                verifiedAt: date('2026-06-10T00:00:00.000Z'),
                rejectionReason: 'Đồng hành tiếp sức mùa thi',
                isPublicVisible: true,
            },
            {
                id: 'donation-203',
                moduleId: 'module-fundraising-2',
                studentId: 'student-6',
                amount: 1200000,
                contributionStatus: 'VERIFIED',
                paymentMethodType: 'PAYOS',
                proofFileId: null,
                paymentProviderTransactionId: 'tx-fund-203',
                verifiedById: 'manager-lcd-1',
                verifiedAt: date('2026-06-12T00:00:00.000Z'),
                rejectionReason: 'Ủng hộ nước uống cho thí sinh',
                isPublicVisible: true,
            },
            {
                id: 'donation-204',
                moduleId: 'module-fundraising-2',
                studentId: 'student-7',
                amount: 350000,
                contributionStatus: 'PENDING',
                paymentMethodType: 'PAYOS',
                proofFileId: null,
                paymentProviderTransactionId: null,
                verifiedById: null,
                verifiedAt: null,
                rejectionReason: 'Đồng hành cùng thí sinh xa nhà',
                isPublicVisible: true,
            },
            {
                id: 'donation-205',
                moduleId: 'module-fundraising-5',
                studentId: 'student-8',
                amount: 2000000,
                contributionStatus: 'VERIFIED',
                paymentMethodType: 'MANUAL_TRANSFER',
                proofFileId: null,
                paymentProviderTransactionId: 'tx-fund-205',
                verifiedById: 'manager-board',
                verifiedAt: date('2026-08-25T00:00:00.000Z'),
                rejectionReason: 'Trao học bổng vượt khó đầu học kỳ',
                isPublicVisible: true,
            },
            {
                id: 'donation-206',
                moduleId: 'module-fundraising-5',
                studentId: 'student-9',
                amount: 150000,
                contributionStatus: 'PENDING',
                paymentMethodType: 'MANUAL_TRANSFER',
                proofFileId: null,
                paymentProviderTransactionId: null,
                verifiedById: null,
                verifiedAt: null,
                rejectionReason: 'Chung tay cùng bạn đến trường',
                isPublicVisible: false,
            },
        ],
    })

    await prisma.moneyContributionTransaction.createMany({
        data: [
            {
                id: 'tx-fund-101',
                moneyContributionId: 'donation-101',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-101',
                providerTransactionId: 'TRANS-101',
                providerStatus: 'Đã nhận tiền',
                providerPayloadJson: { amount: 500000 },
                realtimeStatementMatched: true,
                webhookReceivedAt: date('2026-01-05T00:05:00.000Z'),
            },
            {
                id: 'tx-fund-104',
                moneyContributionId: 'donation-104',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-104',
                providerTransactionId: 'TRANS-104',
                providerStatus: 'Đã nhận tiền',
                providerPayloadJson: { amount: 1000000 },
                realtimeStatementMatched: true,
                webhookReceivedAt: date('2026-01-08T00:05:00.000Z'),
            },
            {
                id: 'tx-fund-201',
                moneyContributionId: 'donation-201',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-201',
                providerTransactionId: 'TRANS-201',
                providerStatus: 'Chờ đối soát',
                providerPayloadJson: { amount: 450000 },
                realtimeStatementMatched: false,
                webhookReceivedAt: null,
            },
            {
                id: 'tx-fund-202',
                moneyContributionId: 'donation-202',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-202',
                providerTransactionId: 'TRANS-202',
                providerStatus: 'Đã nhận tiền',
                providerPayloadJson: { amount: 700000 },
                realtimeStatementMatched: true,
                webhookReceivedAt: date('2026-06-10T00:05:00.000Z'),
            },
            {
                id: 'tx-fund-203',
                moneyContributionId: 'donation-203',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-203',
                providerTransactionId: 'TRANS-203',
                providerStatus: 'Đã nhận tiền',
                providerPayloadJson: { amount: 1200000 },
                realtimeStatementMatched: true,
                webhookReceivedAt: date('2026-06-12T00:05:00.000Z'),
            },
            {
                id: 'tx-fund-205',
                moneyContributionId: 'donation-205',
                providerName: 'PAYOS',
                providerOrderCode: 'ORDER-205',
                providerTransactionId: 'TRANS-205',
                providerStatus: 'Đã nhận tiền',
                providerPayloadJson: { amount: 2000000 },
                realtimeStatementMatched: true,
                webhookReceivedAt: date('2026-08-25T00:05:00.000Z'),
            },
        ],
    })

    await prisma.itemContribution.createMany({
        data: [
            {
                id: 'item-contribution-1',
                moduleId: 'module-item-2',
                studentId: 'student-1',
                contributionStatus: 'RECEIVED',
                handoverConfirmedById: 'manager-clb-1',
                handoverConfirmedAt: date('2026-09-02T00:00:00.000Z'),
                notes: 'Đã giao tại sảnh A5, đóng gói gọn gàng.',
            },
            {
                id: 'item-contribution-2',
                moduleId: 'module-item-2',
                studentId: 'student-2',
                contributionStatus: 'PLEDGED',
                handoverConfirmedById: null,
                handoverConfirmedAt: null,
                notes: 'Cam kết trao vào cuối tuần.',
            },
            {
                id: 'item-contribution-3',
                moduleId: 'module-item-2',
                studentId: 'student-3',
                contributionStatus: 'REJECTED',
                handoverConfirmedById: 'manager-clb-1',
                handoverConfirmedAt: date('2026-09-05T00:00:00.000Z'),
                notes: 'Hiện vật không còn đảm bảo chất lượng sử dụng.',
            },
            {
                id: 'item-contribution-4',
                moduleId: 'module-item-2',
                studentId: 'student-4',
                contributionStatus: 'RECEIVED',
                handoverConfirmedById: 'manager-clb-1',
                handoverConfirmedAt: date('2026-09-06T00:00:00.000Z'),
                notes: 'Tài trợ đủ cả sách và balo.',
            },
            {
                id: 'item-contribution-5',
                moduleId: 'module-item-2',
                studentId: 'student-5',
                contributionStatus: 'RECEIVED',
                handoverConfirmedById: 'manager-clb-1',
                handoverConfirmedAt: date('2026-09-07T00:00:00.000Z'),
                notes: 'Bổ sung áo ấm và hộp sữa.',
            },
            {
                id: 'item-contribution-6',
                moduleId: 'module-item-2',
                studentId: 'student-6',
                contributionStatus: 'PLEDGED',
                handoverConfirmedById: null,
                handoverConfirmedAt: null,
                notes: 'Đã đăng ký mang thêm balo và áo ấm.',
            },
        ],
    })

    await prisma.itemContributionLine.createMany({
        data: [
            {
                id: 'item-line-1',
                itemContributionId: 'item-contribution-1',
                itemTargetId: 'target-item-1',
                actualQuantity: 20,
                itemConditionNote: 'Sách còn mới, đã phân loại theo khối lớp.',
            },
            {
                id: 'item-line-2',
                itemContributionId: 'item-contribution-1',
                itemTargetId: 'target-item-3',
                actualQuantity: 5,
                itemConditionNote:
                    'Balo còn chắc chắn, phù hợp học sinh tiểu học.',
            },
            {
                id: 'item-line-3',
                itemContributionId: 'item-contribution-2',
                itemTargetId: 'target-item-2',
                actualQuantity: 10,
                itemConditionNote: 'Áo ấm đã giặt sạch.',
            },
            {
                id: 'item-line-4',
                itemContributionId: 'item-contribution-3',
                itemTargetId: 'target-item-1',
                actualQuantity: 15,
                itemConditionNote:
                    'Một số sách thiếu trang nên không tiếp nhận.',
            },
            {
                id: 'item-line-5',
                itemContributionId: 'item-contribution-4',
                itemTargetId: 'target-item-1',
                actualQuantity: 30,
                itemConditionNote: 'Sách và truyện thiếu nhi còn tốt.',
            },
            {
                id: 'item-line-6',
                itemContributionId: 'item-contribution-4',
                itemTargetId: 'target-item-3',
                actualQuantity: 10,
                itemConditionNote: 'Balo màu tối, khóa kéo tốt.',
            },
            {
                id: 'item-line-7',
                itemContributionId: 'item-contribution-5',
                itemTargetId: 'target-item-2',
                actualQuantity: 12,
                itemConditionNote: 'Áo ấm trẻ em đủ size.',
            },
            {
                id: 'item-line-8',
                itemContributionId: 'item-contribution-5',
                itemTargetId: 'target-item-4',
                actualQuantity: 30,
                itemConditionNote: 'Sữa còn hạn 8 tháng.',
            },
            {
                id: 'item-line-9',
                itemContributionId: 'item-contribution-6',
                itemTargetId: 'target-item-3',
                actualQuantity: 6,
                itemConditionNote: 'Sẽ giao vào tuần tới.',
            },
        ],
    })

    await prisma.certificateSigningProfile.create({
        data: {
            id: 'sign-profile-1',
            name: 'Ký số nội bộ Đoàn trường',
            signingLevel: 'LEVEL_1_INTERNAL_MARK',
            providerName: 'DEMO_INTERNAL',
            defaultSignerName: 'Bí thư Đoàn trường',
            defaultSignerTitle: 'Bí thư Đoàn trường',
            visualAssetFileId: 'file-signature-asset-1',
            isActive: true,
            signatureVisualConfigJson: {
                x: 1280,
                y: 820,
                width: 260,
                height: 120,
            },
            certificateRef: 'demo-certificate-ref',
            privateKeyRef: 'demo-private-key-ref',
            remoteCaConfigJson: { mode: 'demo' },
        },
    })

    await prisma.certificateTemplate.createMany({
        data: [
            {
                id: 'tpl-1',
                name: 'Mẫu chứng nhận tham gia tình nguyện',
                certificateType: 'VOLUNTEER_COMPLETION',
                ownerType: 'DOANTRUONG',
                ownerManagerAccountId: 'manager-board',
                description:
                    'Dành cho sinh viên hoàn thành hoạt động tình nguyện.',
                isActive: true,
            },
            {
                id: 'tpl-2',
                name: 'Mẫu chứng nhận nhà tài trợ',
                certificateType: 'DONOR_CERTIFICATE',
                ownerType: 'DOANTRUONG',
                ownerManagerAccountId: 'manager-board',
                description:
                    'Ghi nhận các cá nhân, tập thể đóng góp cho chiến dịch.',
                isActive: true,
            },
            {
                id: 'tpl-3',
                name: 'Mẫu chứng nhận hoàn thành chiến dịch',
                certificateType: 'VOLUNTEER_COMPLETION',
                ownerType: 'DOANTRUONG',
                ownerManagerAccountId: 'manager-board',
                description:
                    'Dành cho sinh viên hoàn thành trọn vẹn chiến dịch quy mô lớn.',
                isActive: true,
            },
        ],
    })

    await prisma.certificateTemplateVersion.createMany({
        data: [
            {
                id: 'tplv-1',
                templateId: 'tpl-1',
                versionNumber: 1,
                templateSourceType: 'HTML',
                sourceFileId: 'file-certificate-source-1',
                htmlContent:
                    '<section>Chứng nhận tham gia tình nguyện</section>',
                cssContent: 'body { font-family: serif; }',
                backgroundFileId: 'file-certificate-bg-1',
                placeholderWhitelistJson: [
                    'recipientName',
                    'campaignTitle',
                    'issuedAt',
                ],
                renderConfigJson: { theme: 'red-gold', layout: 'classic' },
                digitalSignatureEnabled: true,
                signatureLevel: 'LEVEL_1_INTERNAL_MARK',
                defaultSigningProfileId: 'sign-profile-1',
                isActive: true,
            },
            {
                id: 'tplv-2',
                templateId: 'tpl-2',
                versionNumber: 1,
                templateSourceType: 'HTML',
                sourceFileId: null,
                htmlContent: '<section>Chứng nhận nhà tài trợ</section>',
                cssContent: 'body { font-family: serif; }',
                backgroundFileId: 'file-certificate-bg-2',
                placeholderWhitelistJson: [
                    'recipientName',
                    'campaignTitle',
                    'amount',
                ],
                renderConfigJson: { theme: 'blue-gold', layout: 'donor' },
                digitalSignatureEnabled: false,
                signatureLevel: null,
                defaultSigningProfileId: null,
                isActive: true,
            },
            {
                id: 'tplv-3',
                templateId: 'tpl-3',
                versionNumber: 1,
                templateSourceType: 'HTML',
                sourceFileId: null,
                htmlContent:
                    '<section>Chứng nhận hoàn thành chiến dịch</section>',
                cssContent: 'body { font-family: serif; }',
                backgroundFileId: 'file-certificate-bg-3',
                placeholderWhitelistJson: [
                    'recipientName',
                    'campaignTitle',
                    'moduleTitle',
                ],
                renderConfigJson: { theme: 'green-gold', layout: 'completion' },
                digitalSignatureEnabled: true,
                signatureLevel: 'LEVEL_1_INTERNAL_MARK',
                defaultSigningProfileId: 'sign-profile-1',
                isActive: true,
            },
        ],
    })

    await prisma.certificateIssuancePolicy.createMany({
        data: [
            {
                id: 'policy-1',
                templateId: 'tpl-1',
                campaignId: 'campaign-1',
                moduleId: 'module-volunteer-1',
                certificateType: 'VOLUNTEER_COMPLETION',
                recipientType: 'STUDENT',
                ruleEngineType: 'REGISTRATION_STATUS',
                ruleConfigJson: { requiredStatuses: ['COMPLETED'] },
                autoIssueEnabled: true,
                isActive: true,
            },
            {
                id: 'policy-2',
                templateId: 'tpl-2',
                campaignId: 'campaign-1',
                moduleId: 'module-fundraising-1',
                certificateType: 'DONOR_CERTIFICATE',
                recipientType: 'DONOR',
                ruleEngineType: 'CONTRIBUTION_VERIFIED',
                ruleConfigJson: { minAmount: 200000 },
                autoIssueEnabled: true,
                isActive: true,
            },
            {
                id: 'policy-3',
                templateId: 'tpl-3',
                campaignId: 'campaign-6',
                moduleId: 'module-volunteer-6',
                certificateType: 'VOLUNTEER_COMPLETION',
                recipientType: 'STUDENT',
                ruleEngineType: 'MANUAL_APPROVAL',
                ruleConfigJson: { issuerRole: 'DOANTRUONG' },
                autoIssueEnabled: false,
                isActive: true,
            },
        ],
    })

    await prisma.certificate.createMany({
        data: [
            {
                id: 'cert-1',
                publicId: 'public-cert-1',
                serialNumber: 'CERT-2026-001',
                templateId: 'tpl-1',
                templateVersionId: 'tplv-1',
                policyId: 'policy-1',
                campaignId: 'campaign-1',
                moduleId: 'module-volunteer-1',
                recipientStudentId: 'student-1',
                recipientName: 'Nguyễn Văn An',
                certificateType: 'VOLUNTEER_COMPLETION',
                recipientType: 'STUDENT',
                registrationId: 'registration-vol-1',
                moneyContributionId: null,
                itemContributionId: null,
                status: 'SIGNED',
                deliveryStatus: 'SENT',
                generatedFileId: null,
                signedFileId: 'file-certificate-signed-1',
                previewImageFileId: 'file-certificate-preview-1',
                checksumSha256: 'checksum-cert-1',
                issuedAt: date('2026-01-25T08:30:00.000Z'),
                emailSentAt: date('2026-01-25T09:00:00.000Z'),
                lastEmailError: null,
                revokedAt: null,
                revocationReason: null,
                reissuedFromCertificateId: null,
                createdById: 'manager-board',
            },
            {
                id: 'cert-2',
                publicId: 'public-cert-2',
                serialNumber: 'CERT-2026-002',
                templateId: 'tpl-2',
                templateVersionId: 'tplv-2',
                policyId: 'policy-2',
                campaignId: 'campaign-1',
                moduleId: 'module-fundraising-1',
                recipientStudentId: 'student-2',
                recipientName: 'Lê Thị Bình',
                certificateType: 'DONOR_CERTIFICATE',
                recipientType: 'STUDENT',
                registrationId: null,
                moneyContributionId: 'donation-102',
                itemContributionId: null,
                status: 'READY',
                deliveryStatus: 'NOT_SENT',
                generatedFileId: null,
                signedFileId: null,
                previewImageFileId: null,
                checksumSha256: 'checksum-cert-2',
                issuedAt: date('2026-07-26T08:30:00.000Z'),
                emailSentAt: null,
                lastEmailError: null,
                revokedAt: null,
                revocationReason: null,
                reissuedFromCertificateId: null,
                createdById: 'manager-board',
            },
            {
                id: 'cert-3',
                publicId: 'public-cert-3',
                serialNumber: 'CERT-2026-003',
                templateId: 'tpl-3',
                templateVersionId: 'tplv-3',
                policyId: 'policy-3',
                campaignId: 'campaign-3',
                moduleId: 'module-event-3',
                recipientStudentId: 'student-3',
                recipientName: 'Phạm Quốc Cường',
                certificateType: 'VOLUNTEER_COMPLETION',
                recipientType: 'STUDENT',
                registrationId: 'registration-evt-5',
                moneyContributionId: null,
                itemContributionId: null,
                status: 'REVOKED',
                deliveryStatus: 'FAILED',
                generatedFileId: null,
                signedFileId: null,
                previewImageFileId: null,
                checksumSha256: 'checksum-cert-3',
                issuedAt: date('2026-07-12T08:00:00.000Z'),
                emailSentAt: null,
                lastEmailError: 'Tệp ký số cần cấp lại.',
                revokedAt: date('2026-07-20T08:00:00.000Z'),
                revocationReason: 'Cập nhật sai giờ công',
                reissuedFromCertificateId: null,
                createdById: 'manager-board',
            },
        ],
    })

    await prisma.certificateSnapshot.createMany({
        data: [
            {
                id: 'snapshot-1',
                certificateId: 'cert-1',
                snapshotVersion: 1,
                dataJson: {
                    recipient_name: 'Nguyễn Văn An',
                    campaign_title: 'Xuân Yêu Thương 2026',
                    issued_note: 'Hoàn thành hậu cần và hỗ trợ trao quà.',
                },
            },
            {
                id: 'snapshot-2',
                certificateId: 'cert-2',
                snapshotVersion: 1,
                dataJson: {
                    recipient_name: 'Lê Thị Bình',
                    campaign_title: 'Xuân Yêu Thương 2026',
                    amount: 200000,
                },
            },
            {
                id: 'snapshot-3',
                certificateId: 'cert-3',
                snapshotVersion: 1,
                dataJson: {
                    recipient_name: 'Phạm Quốc Cường',
                    campaign_title: 'Tiếp Sức Mùa Thi 2026',
                    note: 'Cần cấp lại sau khi điều chỉnh giờ công.',
                },
            },
        ],
    })

    await prisma.certificateRenderJob.createMany({
        data: [
            {
                id: 'render-job-1',
                certificateId: 'cert-1',
                jobType: 'RENDER_AND_SIGN',
                status: 'SUCCESS',
                attemptCount: 1,
                queueName: 'certificate-render',
                payloadJson: { certificateId: 'cert-1' },
                startedAt: date('2026-01-25T08:00:00.000Z'),
                finishedAt: date('2026-01-25T08:15:00.000Z'),
                failureReason: null,
            },
            {
                id: 'render-job-2',
                certificateId: 'cert-2',
                jobType: 'RENDER',
                status: 'PENDING',
                attemptCount: 0,
                queueName: 'certificate-render',
                payloadJson: { certificateId: 'cert-2' },
                startedAt: null,
                finishedAt: null,
                failureReason: null,
            },
            {
                id: 'render-job-3',
                certificateId: 'cert-3',
                jobType: 'SIGN',
                status: 'FAILED',
                attemptCount: 2,
                queueName: 'certificate-sign',
                payloadJson: { certificateId: 'cert-3' },
                startedAt: date('2026-07-12T08:10:00.000Z'),
                finishedAt: date('2026-07-12T08:20:00.000Z'),
                failureReason:
                    'Thông tin giờ công chưa được khóa snapshot đúng phiên bản.',
            },
        ],
    })

    await prisma.certificateAuditLog.createMany({
        data: [
            {
                id: 'audit-1',
                certificateId: 'cert-1',
                action: 'CREATED',
                actorType: 'manager',
                actorId: 'manager-board',
                note: 'Khởi tạo chứng nhận tham gia tình nguyện.',
                metadataJson: { source: 'manual-issue' },
            },
            {
                id: 'audit-2',
                certificateId: 'cert-1',
                action: 'SIGN_SUCCESS',
                actorType: 'system',
                actorId: null,
                note: 'Ký dấu nội bộ thành công.',
                metadataJson: { signingProfile: 'sign-profile-1' },
            },
            {
                id: 'audit-3',
                certificateId: 'cert-2',
                action: 'CREATED',
                actorType: 'manager',
                actorId: 'manager-board',
                note: 'Tạo chứng nhận nhà tài trợ chờ render.',
                metadataJson: { source: 'fundraising-policy' },
            },
            {
                id: 'audit-4',
                certificateId: 'cert-3',
                action: 'CREATED',
                actorType: 'manager',
                actorId: 'manager-board',
                note: 'Tạo chứng nhận hoàn thành tiếp sức mùa thi.',
                metadataJson: { source: 'campaign-completion' },
            },
            {
                id: 'audit-5',
                certificateId: 'cert-3',
                action: 'REVOKED',
                actorType: 'manager',
                actorId: 'manager-board',
                note: 'Thu hồi để cấp lại do sai giờ công.',
                metadataJson: { reason: 'Cập nhật sai giờ công' },
            },
        ],
    })

    await prisma.certificateVerificationLog.createMany({
        data: [
            {
                id: 'verify-log-1',
                certificateId: 'cert-1',
                publicId: 'public-cert-1',
                ipAddress: '127.0.0.1',
                userAgent: 'Seed Verification Bot',
                verifiedAt: date('2026-01-26T00:00:00.000Z'),
                resultStatus: 'VALID',
                referrer: 'https://bkvolunteers.vn/certificates',
            },
            {
                id: 'verify-log-2',
                certificateId: 'cert-3',
                publicId: 'public-cert-3',
                ipAddress: '127.0.0.1',
                userAgent: 'Seed Verification Bot',
                verifiedAt: date('2026-07-21T00:00:00.000Z'),
                resultStatus: 'REVOKED',
                referrer: 'https://bkvolunteers.vn/certificates',
            },
        ],
    })

    await prisma.certificateDigitalSignature.create({
        data: {
            id: 'digital-signature-1',
            certificateId: 'cert-1',
            signingProfileId: 'sign-profile-1',
            status: 'SIGNED',
            provider: 'DEMO_INTERNAL',
            signerName: 'Bí thư Đoàn trường',
            signerTitle: 'Bí thư Đoàn trường',
            signerIdentifier: 'DOANTRUONG-DEMO',
            certificateSerial: 'SIGN-DEMO-0001',
            signatureValue: 'demo-signature-value',
            signedHash: 'demo-signed-hash',
            signedAt: date('2026-01-25T08:14:00.000Z'),
            verificationPayload: { verified: true },
            failureReason: null,
        },
    })

    await prisma.userOAuthAccount.createMany({
        data: [
            {
                id: 'oauth-1',
                userId: 'student-user',
                provider: 'google',
                providerAccountId: 'google-student-user',
            },
            {
                id: 'oauth-2',
                userId: 'board-user',
                provider: 'microsoft',
                providerAccountId: 'ms-board-user',
            },
        ],
    })

    await prisma.userRefreshToken.createMany({
        data: [
            {
                id: 'refresh-1',
                token: 'refresh-token-student-demo',
                userId: 'student-user',
                expiresAt: date('2026-12-31T00:00:00.000Z'),
            },
            {
                id: 'refresh-2',
                token: 'refresh-token-board-demo',
                userId: 'board-user',
                expiresAt: date('2026-12-31T00:00:00.000Z'),
            },
        ],
    })

    await prisma.userResetToken.createMany({
        data: [
            {
                id: 'reset-1',
                token: 'reset-token-student-demo',
                expiresAt: date('2026-12-31T00:00:00.000Z'),
                userId: 'student-user',
            },
        ],
    })

    await prisma.userEmailVerificationToken.createMany({
        data: [
            {
                id: 'verify-email-1',
                token: 'verify-email-student-demo',
                expiresAt: date('2026-12-31T00:00:00.000Z'),
                userId: 'student-user',
            },
        ],
    })

    await prisma.managerNotification.createMany({
        data: [
            {
                id: 'manager-notification-1',
                managerId: 'manager-board',
                type: 'CAMPAIGN',
                title: 'Có chiến dịch mới chờ duyệt',
                message:
                    'Chiến dịch “Áo Ấm Cho Em Vùng Cao” đang chờ Đoàn trường xem xét.',
                targetType: 'CAMPAIGN',
                targetId: 'campaign-2',
                isRead: false,
            },
            {
                id: 'manager-notification-2',
                managerId: 'manager-board',
                type: 'CONTRIBUTION',
                title: 'Có giao dịch mới cần đối soát',
                message:
                    'Khoản quyên góp cho chiến dịch “Tiếp Sức Mùa Thi 2026” vừa phát sinh và cần kiểm tra.',
                targetType: 'CONTRIBUTION',
                targetId: 'donation-201',
                isRead: false,
            },
            {
                id: 'manager-notification-3',
                managerId: 'manager-lcd-1',
                type: 'CERTIFICATE',
                title: 'Có chứng nhận chờ phát hành',
                message:
                    'Một chứng nhận nhà tài trợ đang ở trạng thái READY và chờ render.',
                targetType: 'CERTIFICATE',
                targetId: 'cert-2',
                isRead: true,
            },
        ],
    })

    await prisma.studentNotification.createMany({
        data: [
            {
                id: 'notification-1',
                studentId: 'student-1',
                type: 'REGISTRATION',
                title: 'Đăng ký được duyệt',
                message:
                    'Bạn đã được xếp vào danh sách chờ xác nhận cho hoạt động trực điểm thi.',
                targetType: 'REGISTRATION',
                targetId: 'registration-evt-3',
                isRead: false,
            },
            {
                id: 'notification-2',
                studentId: 'student-1',
                type: 'SYSTEM',
                title: 'Có sự kiện sắp diễn ra',
                message:
                    'Sự kiện “Trực điểm thi và hỗ trợ thí sinh” sẽ bắt đầu trong 3 ngày nữa.',
                targetType: 'MODULE',
                targetId: 'module-event-3',
                isRead: false,
            },
            {
                id: 'notification-3',
                studentId: 'student-1',
                type: 'CERTIFICATE',
                title: 'Đã được cấp chứng nhận',
                message:
                    'Chứng nhận tham gia “Xuân Yêu Thương 2026” của bạn đã sẵn sàng tải về.',
                targetType: 'CERTIFICATE',
                targetId: 'cert-1',
                isRead: true,
            },
            {
                id: 'notification-4',
                studentId: 'student-2',
                type: 'CONTRIBUTION',
                title: 'Khoản ủng hộ đang chờ xác minh',
                message:
                    'Ban tổ chức đã ghi nhận khoản đóng góp của bạn và sẽ xác minh trong thời gian sớm nhất.',
                targetType: 'CONTRIBUTION',
                targetId: 'donation-102',
                isRead: false,
            },
        ],
    })

    console.log('Seeded runtime database successfully')
}
