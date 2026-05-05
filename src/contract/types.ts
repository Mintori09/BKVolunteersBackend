export const CONTRACT_ROLES = [
    'STUDENT',
    'ORG_ADMIN',
    'ORG_MEMBER',
    'SCHOOL_REVIEWER',
    'SCHOOL_ADMIN',
    'SYSTEM',
] as const

export type ContractRole = (typeof CONTRACT_ROLES)[number]

export type AccountType = 'STUDENT' | 'OPERATOR'

export type JwtContractPayload = {
    userId: string
    accountType: AccountType
    role: ContractRole
    organizationId?: string | null
    facultyId?: string | null
}

export type CampaignStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'APPROVED'
    | 'REVISION_REQUIRED'
    | 'REJECTED'
    | 'PUBLISHED'
    | 'ONGOING'
    | 'ENDED'
    | 'ARCHIVED'

export type ModuleType = 'fundraising' | 'item_donation' | 'event'

export type ModuleStatus =
    | 'DRAFT'
    | 'READY_FOR_REVIEW'
    | 'APPROVED'
    | 'OPEN'
    | 'CLOSED'
    | 'CANCELLED'

export type MoneyDonationStatus =
    | 'PENDING'
    | 'MATCHED'
    | 'VERIFIED'
    | 'REJECTED'
    | 'REFUNDED'

export type ItemPledgeStatus =
    | 'PLEDGED'
    | 'CONFIRMED'
    | 'RECEIVED'
    | 'REJECTED'
    | 'CANCELLED'

export type EventRegistrationStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CHECKED_IN'
    | 'COMPLETED'

export type CertificateStatus =
    | 'PENDING'
    | 'RENDERING'
    | 'READY'
    | 'SIGNED'
    | 'REVOKED'
    | 'FAILED'

export const isOperatorRole = (role?: string): role is Exclude<ContractRole, 'STUDENT'> =>
    role === 'ORG_ADMIN' ||
    role === 'ORG_MEMBER' ||
    role === 'SCHOOL_REVIEWER' ||
    role === 'SCHOOL_ADMIN' ||
    role === 'SYSTEM'

