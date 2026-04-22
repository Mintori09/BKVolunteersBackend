import type {
    CampaignApprovalStatus,
    CampaignPublicationStatus,
    ClubMembershipStatus,
    ContributionStatus,
    ManagerAccountStatus,
    ManagerRoleType,
    OrganizerType,
    RegistrationStatus,
} from '@prisma/client'

export interface WorkspaceCampaignItem {
    id: string
    title: string
    slogan: string | null
    summary: string
    organizerType: OrganizerType
    scopeName: string
    facultyId: number | null
    facultyName: string | null
    clubId: string | null
    clubName: string | null
    approvalStatus: CampaignApprovalStatus
    publicationStatus: CampaignPublicationStatus
    steps: {
        basicInfo: boolean
        fundraising: boolean
        itemDonation: boolean
        volunteerRecruitment: boolean
        attachments: boolean
        preview: boolean
    }
    fundraisingTarget: number
    verifiedAmount: number
    itemCategories: number
    volunteerSlots: number
    approvedVolunteers: number
    pendingRegistrations: number
    needsManualVerification: number
    updatedAt: Date
    nextAction: string
}

export interface WorkspaceMembershipItem {
    id: string
    fullName: string
    studentCode: string
    facultyName: string
    requestedAt: Date
    status: ClubMembershipStatus
    unitRole: string
    clubId: string | null
    facultyId: number | null
    note: string | null
}

export interface WorkspaceRegistrationItem {
    id: string
    campaignId: string
    campaignTitle: string
    studentName: string
    facultyName: string
    appliedAt: Date
    preferredShift: string
    status: RegistrationStatus
    note: string | null
}

export interface WorkspaceContributionItem {
    id: string
    campaignId: string
    campaignTitle: string
    donorName: string
    amount: number
    proofCode: string
    submittedAt: Date
    status: ContributionStatus
}

export interface WorkspaceCertificateItem {
    id: string
    registrationId: string
    campaignId: string
    campaignTitle: string
    studentName: string
    completedHours: number
    status: 'PENDING' | 'GENERATED' | 'EMAILED'
    updatedAt: Date
}

export interface WorkspaceActivityItem {
    id: string
    title: string
    description: string
    timestamp: Date
    category:
        | 'campaign'
        | 'membership'
        | 'registration'
        | 'contribution'
        | 'certificate'
        | 'report'
}

export interface WorkspaceReportExportResponse {
    filename: string
    contentType: string
    content: string
}

export interface ManagerWorkspaceResponse {
    manager: {
        id: string
        roleType: ManagerRoleType
        status: ManagerAccountStatus
        scopeName: string
        facultyId: number | null
        facultyName: string | null
        clubId: string | null
        clubName: string | null
    }
    campaigns: WorkspaceCampaignItem[]
    membershipRequests: WorkspaceMembershipItem[]
    volunteerRegistrations: WorkspaceRegistrationItem[]
    contributionReviews: WorkspaceContributionItem[]
    certificates: WorkspaceCertificateItem[]
    activityLog: WorkspaceActivityItem[]
    pendingActions: number
    totalVerifiedAmount: number
}

export interface WorkspaceEntityRouteParams {
    id: string
}

export interface UpdateMembershipStatusPayload {
    status: Extract<ClubMembershipStatus, 'APPROVED' | 'REJECTED' | 'REMOVED'>
}

export interface ReviewRegistrationPayload {
    status: Extract<RegistrationStatus, 'APPROVED' | 'REJECTED' | 'WAITLISTED'>
    note?: string
}

export interface ReviewContributionPayload {
    status: Extract<ContributionStatus, 'VERIFIED' | 'REJECTED'>
    note?: string
}

export interface ExportWorkspaceReportPayload {
    type: 'volunteers' | 'contributions' | 'campaigns'
}
