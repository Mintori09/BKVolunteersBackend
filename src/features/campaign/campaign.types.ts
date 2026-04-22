import type {
    ApprovalStepStatus,
    ApprovalStepType,
    CampaignApprovalStatus,
    CampaignPhaseStatus,
    CampaignPhaseType,
    CampaignPublicationStatus,
    CampaignStatusGroup,
    CampaignTemplateType,
    CertificateDeliveryStatus,
    ContributionStatus,
    ContributionType,
    ManagerAccountStatus,
    ManagerRoleType,
    OrganizerType,
    ParticipantScope,
    RegistrationStatus,
    VerificationMode,
} from '@prisma/client'

export interface CreateDraftCampaignPayload {
    title: string
    description?: string
}

export interface UpdateDraftCampaignPayload extends CreateDraftCampaignPayload {}

export interface CampaignDraftRouteParams {
    id: string
}

export interface CampaignDraftBootstrapResponse {
    manager: {
        id: string
        roleType: ManagerRoleType
        status: ManagerAccountStatus
    }
    organizer: {
        type: OrganizerType
        scopeName: string
        facultyId: number | null
        facultyName: string | null
        clubId: string | null
        clubName: string | null
    }
    draftDefaults: {
        approvalStatus: CampaignApprovalStatus
        publicationStatus: CampaignPublicationStatus
    }
    fieldPolicy: {
        requiredFields: string[]
        optionalFields: string[]
        supportsAttachments: boolean
    }
}

export interface CampaignDraftResponse {
    id: string
    title: string
    description: string
    organizerType: OrganizerType
    approvalStatus: CampaignApprovalStatus
    publicationStatus: CampaignPublicationStatus
    creatorManagerId: string
    facultyId: number | null
    facultyName: string | null
    clubId: string | null
    clubName: string | null
    attachments: Array<{
        id: string
        fileId: string
        fileType: string
        originalName: string
        mimeType: string
        fileSize: number
        createdAt: Date
    }>
    createdAt: Date
    updatedAt: Date
}

export interface OrganizerCampaignRouteParams {
    id: string
}

export interface OrganizerCampaignDocumentRouteParams
    extends OrganizerCampaignRouteParams {
    documentId: string
}

export interface OrganizerCampaignCertificateTemplateRouteParams
    extends OrganizerCampaignRouteParams {
    phaseId: string
}

export interface CampaignLifecyclePayload {
    action: 'pause' | 'resume' | 'end'
}

export interface CampaignActionResponse {
    id: string
    approvalStatus: CampaignApprovalStatus
    publicationStatus: CampaignPublicationStatus
}

export interface OrganizerCampaignTemplateDefinition {
    type: CampaignTemplateType
    code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
    title: string
    description: string
    phaseBlueprint: Array<{
        phaseType: CampaignPhaseType
        label: string
    }>
}

export interface OrganizerBankAccountSummary {
    id: string
    bankName: string
    accountName: string
    accountNumber: string
    ownerName: string
}

export interface OrganizerCampaignBootstrapResponse {
    manager: {
        id: string
        roleType: ManagerRoleType
        status: ManagerAccountStatus
    }
    organizer: {
        type: OrganizerType
        scopeName: string
        facultyId: number | null
        facultyName: string | null
        clubId: string | null
        clubName: string | null
    }
    templates: OrganizerCampaignTemplateDefinition[]
    bankAccounts: OrganizerBankAccountSummary[]
    policies: {
        allowOwnershipSelection: boolean
        allowFacultySelection: boolean
        lockedParticipantScope: ParticipantScope | null
        canPublishApprovedCampaigns: boolean
    }
}

export interface OrganizerCampaignAcceptedItemInput {
    itemName: string
    description?: string | null
}

export interface OrganizerCampaignFundraisingInput {
    targetAmount: number
    bankAccountId?: string | null
    bankAccountDraft?: {
        bankName: string
        accountNumber: string
        ownerName: string
        accountName?: string | null
    } | null
    transferNotePrefix?: string | null
    usageDescription?: string | null
    verificationMode?: VerificationMode
}

export interface OrganizerCampaignItemDonationInput {
    collectionAddress: string
    collectionNote?: string | null
    allowPreRegistration?: boolean
    acceptedItems: OrganizerCampaignAcceptedItemInput[]
}

export interface OrganizerCampaignVolunteerInput {
    maxParticipants: number
    participantScope: ParticipantScope
    requiresCheckin?: boolean
    taskDescription?: string | null
}

export interface OrganizerCampaignPhaseInput {
    id?: string
    phaseName: string
    phaseType: CampaignPhaseType
    startAt: string
    endAt: string
    registrationStartAt?: string | null
    registrationEndAt?: string | null
    locationText?: string | null
    fundraisingConfig?: OrganizerCampaignFundraisingInput
    itemDonationConfig?: OrganizerCampaignItemDonationInput
    volunteerConfig?: OrganizerCampaignVolunteerInput
}

export interface UpsertOrganizerCampaignPayload {
    title: string
    slogan?: string | null
    description: string
    templateType: CampaignTemplateType
    publicFrom?: string | null
    publicUntil?: string | null
    phases: OrganizerCampaignPhaseInput[]
}

export interface CampaignFileAsset {
    id: string
    originalName: string
    mimeType: string
    fileSize: number
    url: string | null
    createdAt: Date
}

export interface OrganizerCampaignDocument {
    id: string
    fileId: string
    fileType: string
    phaseId: string | null
    isPublic: boolean
    createdAt: Date
    file: CampaignFileAsset
}

export interface OrganizerCampaignPhaseSummary {
    id: string
    phaseOrder: number
    phaseName: string
    phaseType: CampaignPhaseType
    startAt: Date
    endAt: Date
    registrationStartAt: Date | null
    registrationEndAt: Date | null
    locationText: string | null
    status: CampaignPhaseStatus
    fundraisingConfig: null | {
        targetAmount: number
        transferNotePrefix: string | null
        usageDescription: string | null
        verificationMode: VerificationMode
        bankAccount: OrganizerBankAccountSummary
        qrFile: CampaignFileAsset | null
    }
    itemDonationConfig: null | {
        collectionAddress: string
        collectionNote: string | null
        allowPreRegistration: boolean
        acceptedItems: Array<{
            id: string
            itemName: string
            description: string | null
        }>
    }
    volunteerConfig: null | {
        maxParticipants: number
        participantScope: ParticipantScope
        requiresCheckin: boolean
        taskDescription: string | null
        certificateTemplateFile: CampaignFileAsset | null
        certificateNamePosXPercent: number
        certificateNamePosYPercent: number
        certificateNameFontSize: number
        certificateNameColorHex: string
    }
}

export interface OrganizerCampaignMetricSummary {
    verifiedAmount: number
    fundraisingTarget: number
    approvedVolunteers: number
    volunteerSlots: number
    pendingRegistrations: number
    pendingContributions: number
    acceptedItemCategories: number
}

export interface OrganizerCampaignQuickAction {
    key:
        | 'view'
        | 'edit'
        | 'delete'
        | 'submit'
        | 'resubmit'
        | 'approve'
        | 'publish'
        | 'pause'
        | 'resume'
        | 'end'
        | 'export'
    label: string
}

export interface OrganizerCampaignListItem {
    id: string
    title: string
    slogan: string | null
    description: string
    organizerType: OrganizerType
    templateType: CampaignTemplateType | null
    scopeName: string
    approvalStatus: CampaignApprovalStatus
    publicationStatus: CampaignPublicationStatus
    publicFrom: Date | null
    publicUntil: Date | null
    currentPhaseLabel: string | null
    nextAction: string
    metrics: OrganizerCampaignMetricSummary
    quickActions: OrganizerCampaignQuickAction[]
    coverImage: CampaignFileAsset | null
    updatedAt: Date
}

export interface OrganizerCampaignListResponse {
    campaigns: OrganizerCampaignListItem[]
}

export interface OrganizerCampaignDetailResponse {
    id: string
    title: string
    slogan: string | null
    description: string
    organizerType: OrganizerType
    templateType: CampaignTemplateType | null
    approvalStatus: CampaignApprovalStatus
    publicationStatus: CampaignPublicationStatus
    publicFrom: Date | null
    publicUntil: Date | null
    createdAt: Date
    updatedAt: Date
    organizer: {
        type: OrganizerType
        scopeName: string
        facultyId: number | null
        facultyName: string | null
        clubId: string | null
        clubName: string | null
    }
    currentPhaseLabel: string | null
    nextAction: string
    metrics: OrganizerCampaignMetricSummary
    quickActions: OrganizerCampaignQuickAction[]
    coverImage: CampaignFileAsset | null
    logoImage: CampaignFileAsset | null
    documents: OrganizerCampaignDocument[]
    phases: OrganizerCampaignPhaseSummary[]
}

export interface OrganizerCampaignWorkspaceTab {
    id:
        | 'overview'
        | 'phases'
        | 'documents'
        | 'fundraising'
        | 'item-donation'
        | 'volunteers'
        | 'certificates'
        | 'activity-evidence'
        | 'reports'
    label: string
}

export interface OrganizerCampaignApprovalItem {
    id: string
    stepType: ApprovalStepType
    status: ApprovalStepStatus
    reviewerName: string
    comment: string | null
    reviewedAt: Date | null
    createdAt: Date
}

export interface OrganizerCampaignHistoryItem {
    id: string
    statusGroup: CampaignStatusGroup
    fromStatus: string | null
    toStatus: string
    note: string | null
    changedByName: string
    createdAt: Date
}

export interface OrganizerCampaignRegistrationItem {
    id: string
    phaseId: string
    phaseName: string
    studentName: string
    studentCode: string
    studentEmail: string
    facultyName: string
    appliedAt: Date
    status: RegistrationStatus
    note: string | null
}

export interface OrganizerCampaignContributionItem {
    id: string
    phaseId: string
    phaseName: string
    donorName: string
    donorCode: string
    facultyName: string
    contributionType: ContributionType
    amount: number
    itemDescription: string | null
    submittedAt: Date
    status: ContributionStatus
    proofFileName: string | null
}

export interface OrganizerCampaignCertificateItem {
    id: string
    registrationId: string
    studentName: string
    phaseId: string
    phaseName: string
    deliveryStatus: CertificateDeliveryStatus
    issuedAt: Date | null
    fileName: string | null
}

export interface OrganizerCampaignWorkspaceResponse {
    campaign: OrganizerCampaignDetailResponse
    tabs: OrganizerCampaignWorkspaceTab[]
    approvals: OrganizerCampaignApprovalItem[]
    history: OrganizerCampaignHistoryItem[]
    registrations: OrganizerCampaignRegistrationItem[]
    contributions: OrganizerCampaignContributionItem[]
    certificates: OrganizerCampaignCertificateItem[]
}

export interface CampaignExportResponse {
    filename: string
    contentType: string
    content: string
    encoding: 'base64'
}

export interface ExportOrganizerCampaignPayload {
    phaseId: string
    unitName: string
    signerName: string
    preparedByName: string
}

export interface UpdateCampaignCertificateLayoutPayload {
    phaseId: string
    namePosXPercent: number
    namePosYPercent: number
    fontSize: number
    fontColorHex: string
}

export interface CampaignCertificateLayoutResponse {
    campaignId: string
    phaseId: string
    certificateTemplateFile: CampaignFileAsset | null
    namePosXPercent: number
    namePosYPercent: number
    fontSize: number
    fontColorHex: string
}

export interface SendCampaignCertificateEmailsPayload {
    phaseId: string
    registrationIds?: string[]
    senderName?: string | null
    senderEmail?: string | null
    subject: string
    htmlContentBase64: string
}

export interface SendCampaignCertificateEmailsResponse {
    campaignId: string
    phaseId: string
    senderName: string
    senderEmail: string
    subject: string
    recipientCount: number
    sentCount: number
    failedCount: number
    sentRecipients: Array<{
        registrationId: string
        studentName: string
        studentCode: string
        studentEmail: string
    }>
    failedRecipients: Array<{
        registrationId: string
        studentName: string
        studentCode: string
        studentEmail: string
        reason: string
    }>
}

export interface UpsertGeneratedCampaignCertificatesPayload {
    phaseId: string
    items: Array<{
        registrationId: string
        fileId: string
    }>
}

export interface UpsertGeneratedCampaignCertificatesResponse {
    campaignId: string
    phaseId: string
    savedCount: number
    createdCount: number
    updatedCount: number
    items: Array<{
        registrationId: string
        certificateId: string
        fileId: string
        action: 'created' | 'updated'
    }>
}
