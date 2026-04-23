import { Options } from 'swagger-jsdoc'
import config from './config'

export const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express TS Starter Kit API',
            version: '1.0.0',
            description:
                'API documentation for the Express TypeScript Starter Kit',
        },
        servers: [
            {
                url: config.server.url + '/api/v1',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ApiResponseSuccess: {
                    type: 'object',
                    required: ['success', 'message', 'data'],
                    properties: {
                        success: {
                            type: 'boolean',
                            enum: [true],
                        },
                        message: {
                            type: 'string',
                        },
                        data: {},
                    },
                },
                ApiResponseError: {
                    type: 'object',
                    required: ['success', 'message', 'errors'],
                    properties: {
                        success: {
                            type: 'boolean',
                            enum: [false],
                        },
                        message: {
                            type: 'string',
                        },
                        errors: {},
                        stack: {
                            type: 'string',
                        },
                    },
                },
                PaginationMeta: {
                    type: 'object',
                    required: ['total', 'page', 'limit', 'totalPages'],
                    properties: {
                        total: {
                            type: 'integer',
                        },
                        page: {
                            type: 'integer',
                        },
                        limit: {
                            type: 'integer',
                        },
                        totalPages: {
                            type: 'integer',
                        },
                    },
                },
                LoginOutput: {
                    type: 'object',
                    required: ['accessToken'],
                    properties: {
                        accessToken: {
                            type: 'string',
                        },
                    },
                },
                CampaignUserSummary: {
                    type: 'object',
                    required: ['id', 'username', 'email', 'role'],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        username: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        role: {
                            type: 'string',
                        },
                    },
                },
                CampaignOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'title',
                        'scope',
                        'status',
                        'creatorId',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        title: {
                            type: 'string',
                        },
                        description: {
                            type: ['string', 'null'],
                        },
                        scope: {
                            type: 'string',
                            enum: ['KHOA', 'TRUONG'],
                        },
                        status: {
                            type: 'string',
                        },
                        planFileUrl: {
                            type: ['string', 'null'],
                        },
                        budgetFileUrl: {
                            type: ['string', 'null'],
                        },
                        adminComment: {
                            type: ['string', 'null'],
                        },
                        approverId: {
                            type: ['string', 'null'],
                        },
                        creatorId: {
                            type: 'string',
                        },
                        facultyId: {
                            type: ['integer', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        deletedAt: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        creator: {
                            $ref: '#/components/schemas/CampaignUserSummary',
                        },
                        approver: {
                            $ref: '#/components/schemas/CampaignUserSummary',
                        },
                    },
                },
                CampaignListOutput: {
                    type: 'object',
                    required: ['campaigns', 'meta'],
                    properties: {
                        campaigns: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/CampaignOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                ClubFacultySummary: {
                    type: 'object',
                    required: ['id', 'code', 'name'],
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        code: {
                            type: 'string',
                        },
                        name: {
                            type: 'string',
                        },
                    },
                },
                ClubLeaderSummary: {
                    type: 'object',
                    required: ['id', 'username', 'email'],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        username: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                    },
                },
                ClubDetail: {
                    type: 'object',
                    required: ['id', 'name', 'createdAt', 'updatedAt'],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        name: {
                            type: 'string',
                        },
                        facultyId: {
                            type: ['integer', 'null'],
                        },
                        leaderId: {
                            type: ['string', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        deletedAt: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        faculty: {
                            oneOf: [
                                { $ref: '#/components/schemas/ClubFacultySummary' },
                                { type: 'null' },
                            ],
                        },
                        leader: {
                            oneOf: [
                                { $ref: '#/components/schemas/ClubLeaderSummary' },
                                { type: 'null' },
                            ],
                        },
                    },
                },
                ClubListOutput: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ClubDetail',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                EventOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'campaignId',
                        'location',
                        'maxParticipants',
                        'registrationStart',
                        'registrationEnd',
                        'eventStart',
                        'eventEnd',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        campaignId: {
                            type: 'string',
                        },
                        location: {
                            type: 'string',
                        },
                        maxParticipants: {
                            type: 'integer',
                        },
                        registrationStart: {
                            type: 'string',
                            format: 'date-time',
                        },
                        registrationEnd: {
                            type: 'string',
                            format: 'date-time',
                        },
                        eventStart: {
                            type: 'string',
                            format: 'date-time',
                        },
                        eventEnd: {
                            type: 'string',
                            format: 'date-time',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                EventDetailOutput: {
                    allOf: [
                        { $ref: '#/components/schemas/EventOutput' },
                        {
                            type: 'object',
                            properties: {
                                campaign: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        title: { type: 'string' },
                                        scope: { type: 'string' },
                                        status: { type: 'string' },
                                        facultyId: {
                                            type: ['integer', 'null'],
                                        },
                                        creatorId: { type: 'string' },
                                    },
                                },
                                _count: {
                                    type: 'object',
                                    properties: {
                                        participants: {
                                            type: 'integer',
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                EventListOutput: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/EventOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                ParticipantOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'eventId',
                        'studentId',
                        'status',
                        'isCheckedIn',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        eventId: {
                            type: 'integer',
                        },
                        studentId: {
                            type: 'string',
                        },
                        status: {
                            type: 'string',
                        },
                        isCheckedIn: {
                            type: 'boolean',
                        },
                        certificateUrl: {
                            type: ['string', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                ParticipantWithStudentOutput: {
                    allOf: [
                        { $ref: '#/components/schemas/ParticipantOutput' },
                        {
                            type: 'object',
                            properties: {
                                student: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        mssv: { type: 'string' },
                                        fullName: { type: 'string' },
                                        email: { type: 'string' },
                                        phone: {
                                            type: ['string', 'null'],
                                        },
                                        className: {
                                            type: ['string', 'null'],
                                        },
                                        faculty: {
                                            oneOf: [
                                                {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'integer' },
                                                        code: { type: 'string' },
                                                        name: { type: 'string' },
                                                    },
                                                },
                                                { type: 'null' },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                ParticipantWithEventOutput: {
                    allOf: [
                        { $ref: '#/components/schemas/ParticipantOutput' },
                        {
                            type: 'object',
                            properties: {
                                event: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer' },
                                        location: { type: 'string' },
                                        eventStart: {
                                            type: 'string',
                                            format: 'date-time',
                                        },
                                        eventEnd: {
                                            type: 'string',
                                            format: 'date-time',
                                        },
                                        campaign: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                title: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                ParticipantListOutput: {
                    type: 'object',
                    required: ['data', 'meta'],
                    properties: {
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ParticipantOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                BulkCertificateResult: {
                    type: 'object',
                    required: [
                        'successCount',
                        'failedCount',
                        'failedParticipants',
                    ],
                    properties: {
                        successCount: {
                            type: 'integer',
                        },
                        failedCount: {
                            type: 'integer',
                        },
                        failedParticipants: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['participantId', 'error'],
                                properties: {
                                    participantId: {
                                        type: 'string',
                                    },
                                    error: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                },
                MoneyPhaseProgress: {
                    type: 'object',
                    required: [
                        'phaseId',
                        'targetAmount',
                        'currentAmount',
                        'percentage',
                        'totalDonations',
                        'verifiedDonations',
                        'pendingDonations',
                        'rejectedDonations',
                        'recentDonations',
                    ],
                    properties: {
                        phaseId: {
                            type: 'integer',
                        },
                        targetAmount: {
                            type: 'string',
                        },
                        currentAmount: {
                            type: 'string',
                        },
                        percentage: {
                            type: 'number',
                        },
                        totalDonations: {
                            type: 'integer',
                        },
                        verifiedDonations: {
                            type: 'integer',
                        },
                        pendingDonations: {
                            type: 'integer',
                        },
                        rejectedDonations: {
                            type: 'integer',
                        },
                        recentDonations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['id', 'amount', 'status', 'createdAt'],
                                properties: {
                                    id: {
                                        type: 'string',
                                    },
                                    amount: {
                                        type: 'string',
                                    },
                                    status: {
                                        type: 'string',
                                    },
                                    createdAt: {
                                        type: 'string',
                                        format: 'date-time',
                                    },
                                    student: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            mssv: { type: 'string' },
                                            fullName: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                MoneyPhaseWithCampaign: {
                    type: 'object',
                    required: ['id', 'campaign'],
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        targetAmount: {
                            type: 'string',
                        },
                        bankAccountNo: {
                            type: 'string',
                        },
                        bankAccountName: {
                            type: 'string',
                        },
                        bankCode: {
                            type: 'string',
                        },
                        startDate: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        endDate: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        campaign: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                title: { type: 'string' },
                                status: { type: 'string' },
                                creatorId: { type: 'string' },
                            },
                        },
                    },
                },
                SystemStatisticsOutput: {
                    type: 'object',
                    required: [
                        'totalStudents',
                        'totalUsers',
                        'totalClubs',
                        'totalCampaigns',
                        'campaignsByStatus',
                        'totalVerifiedDonationAmount',
                    ],
                    properties: {
                        totalStudents: {
                            type: 'integer',
                        },
                        totalUsers: {
                            type: 'integer',
                        },
                        totalClubs: {
                            type: 'integer',
                        },
                        totalCampaigns: {
                            type: 'integer',
                        },
                        campaignsByStatus: {
                            type: 'object',
                            properties: {
                                DRAFT: { type: 'integer' },
                                PENDING: { type: 'integer' },
                                ACTIVE: { type: 'integer' },
                                REJECTED: { type: 'integer' },
                                COMPLETED: { type: 'integer' },
                                CANCELLED: { type: 'integer' },
                            },
                        },
                        totalVerifiedDonationAmount: {
                            type: 'number',
                        },
                    },
                },
                ItemPhaseOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'campaignId',
                        'acceptedItems',
                        'collectionAddress',
                        'startDate',
                        'endDate',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'integer',
                        },
                        campaignId: {
                            type: 'string',
                        },
                        acceptedItems: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                        },
                        collectionAddress: {
                            type: ['string', 'null'],
                        },
                        startDate: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        endDate: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                DonationOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'amount',
                        'verifiedAmount',
                        'proofImageUrl',
                        'status',
                        'rejectionReason',
                        'createdAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        amount: {
                            type: 'string',
                        },
                        verifiedAmount: {
                            type: ['string', 'null'],
                        },
                        proofImageUrl: {
                            type: ['string', 'null'],
                        },
                        status: {
                            type: 'string',
                        },
                        rejectionReason: {
                            type: ['string', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        student: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                mssv: { type: 'string' },
                                fullName: { type: 'string' },
                            },
                        },
                        moneyPhase: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                campaign: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        title: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
                DonationListOutput: {
                    type: 'object',
                    required: ['donations', 'meta'],
                    properties: {
                        donations: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/DonationOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                ItemDonationOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'studentId',
                        'itemPhaseId',
                        'itemDescription',
                        'proofImageUrl',
                        'status',
                        'createdAt',
                        'updatedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        studentId: {
                            type: 'string',
                        },
                        itemPhaseId: {
                            type: 'integer',
                        },
                        itemDescription: {
                            type: ['string', 'null'],
                        },
                        proofImageUrl: {
                            type: ['string', 'null'],
                        },
                        status: {
                            type: 'string',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                ItemDonationListOutput: {
                    type: 'object',
                    required: ['donations', 'meta'],
                    properties: {
                        donations: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ItemDonationOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                UploadOutput: {
                    type: 'object',
                    required: [
                        'url',
                        'filename',
                        'originalName',
                        'mimeType',
                        'size',
                        'path',
                    ],
                    properties: {
                        url: {
                            type: 'string',
                        },
                        filename: {
                            type: 'string',
                        },
                        originalName: {
                            type: 'string',
                        },
                        mimeType: {
                            type: 'string',
                        },
                        size: {
                            type: 'integer',
                        },
                        path: {
                            type: 'string',
                        },
                    },
                },
                UserOutput: {
                    type: 'object',
                    required: [
                        'id',
                        'username',
                        'email',
                        'role',
                        'facultyId',
                        'createdAt',
                        'updatedAt',
                        'deletedAt',
                    ],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        username: {
                            type: 'string',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                        },
                        role: {
                            type: 'string',
                        },
                        facultyId: {
                            type: ['integer', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        deletedAt: {
                            type: ['string', 'null'],
                            format: 'date-time',
                        },
                    },
                },
                NotificationListOutput: {
                    type: 'object',
                    required: ['items', 'meta'],
                    properties: {
                        items: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/NotificationOutput',
                            },
                        },
                        meta: {
                            $ref: '#/components/schemas/PaginationMeta',
                        },
                    },
                },
                NotificationOutput: {
                    type: 'object',
                    required: ['id', 'title', 'message', 'type', 'isRead'],
                    properties: {
                        id: {
                            type: 'string',
                        },
                        title: {
                            type: 'string',
                        },
                        message: {
                            type: 'string',
                        },
                        type: {
                            type: 'string',
                        },
                        isRead: {
                            type: 'boolean',
                        },
                        recipientUserId: {
                            type: ['string', 'null'],
                        },
                        recipientStudentId: {
                            type: ['string', 'null'],
                        },
                        relatedEntityType: {
                            type: ['string', 'null'],
                        },
                        relatedEntityId: {
                            type: ['string', 'null'],
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                NotificationBatchUpdateOutput: {
                    type: 'object',
                    required: ['count'],
                    properties: {
                        count: {
                            type: 'integer',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/features/**/*.route.ts', './src/features/**/*.types.ts'], // Path to the API docs
}
