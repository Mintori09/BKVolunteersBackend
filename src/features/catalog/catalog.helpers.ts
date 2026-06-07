import {
    CampaignModuleStatus,
    CampaignModuleType,
    CampaignStatus,
    ContributionStatus,
    ItemContributionStatus,
    ModuleRegistrationStatus,
    ParticipationScopeType,
    ReviewStatus,
} from '@prisma/client'

export const slugify = (value: string) =>
    value
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

export const mapScopeToLegacy = (
    scope: ParticipationScopeType
): 'FACULTY' | 'SCHOOL' | 'PUBLIC' => {
    if (scope === 'FACULTY_INTERNAL') {
        return 'FACULTY'
    }

    if (scope === 'CLUB_INTERNAL') {
        return 'SCHOOL'
    }

    return 'PUBLIC'
}

export const mapLegacyScopeToDb = (scope?: string): ParticipationScopeType => {
    if (scope === 'FACULTY') {
        return 'FACULTY_INTERNAL'
    }

    if (scope === 'SCHOOL') {
        return 'CLUB_INTERNAL'
    }

    return 'SCHOOL_WIDE'
}

export const mapModuleTypeToLegacy = (
    moduleType: CampaignModuleType
): 'fundraising' | 'item_donation' | 'event' | 'volunteer' => {
    if (moduleType === 'FUNDRAISING_MONEY') {
        return 'fundraising'
    }

    if (moduleType === 'ITEM_DONATION') {
        return 'item_donation'
    }

    if (moduleType === 'EVENT') {
        return 'event'
    }

    return 'volunteer'
}

export const mapLegacyModuleTypeToDb = (type: string): CampaignModuleType => {
    if (type === 'fundraising') {
        return 'FUNDRAISING_MONEY'
    }

    if (type === 'item_donation') {
        return 'ITEM_DONATION'
    }

    if (type === 'event') {
        return 'EVENT'
    }

    return 'VOLUNTEER_RECRUITMENT'
}

export const mapReviewStatusToLegacyCampaignStatus = (
    reviewStatus: ReviewStatus
):
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'REVISION_REQUIRED'
    | 'REJECTED'
    | 'APPROVED' => {
    if (reviewStatus === 'PRE_APPROVED') {
        return 'PRE_APPROVED'
    }

    if (reviewStatus === 'REVISION_REQUIRED') {
        return 'REVISION_REQUIRED'
    }

    if (reviewStatus === 'REJECTED') {
        return 'REJECTED'
    }

    if (reviewStatus === 'FINAL_APPROVED') {
        return 'APPROVED'
    }

    return 'SUBMITTED'
}

export const mapCampaignStatusToLegacy = (
    status: CampaignStatus,
    reviewStatus?: ReviewStatus | null
) => {
    if (reviewStatus) {
        if (reviewStatus === 'PRE_APPROVED') {
            return 'PRE_APPROVED' as const
        }

        if (reviewStatus === 'REVISION_REQUIRED') {
            return 'REVISION_REQUIRED' as const
        }

        if (reviewStatus === 'REJECTED') {
            return 'REJECTED' as const
        }
    }

    return status
}

export const mapModuleStatusToLegacy = (
    status: CampaignModuleStatus
): 'DRAFT' | 'READY' | 'APPROVED' | 'OPEN' | 'CLOSED' | 'CANCELLED' => {
    if (status === 'DRAFT') {
        return 'DRAFT'
    }

    if (status === 'READY') {
        return 'READY'
    }

    if (status === 'ACTIVE') {
        return 'OPEN'
    }

    if (status === 'PAUSED' || status === 'ENDED') {
        return 'CLOSED'
    }

    return 'CANCELLED'
}

export const mapRegistrationStatusToLegacy = (
    registrationStatus: ModuleRegistrationStatus,
    checkinState?: 'CHECKED_IN' | 'COMPLETED' | null
) => {
    if (checkinState) {
        return checkinState
    }

    return registrationStatus
}

export const mapContributionStatusToLegacy = (
    status: ContributionStatus,
    matched: boolean
) => {
    if (status === 'VERIFIED') {
        return 'VERIFIED' as const
    }

    if (status === 'REJECTED') {
        return 'REJECTED' as const
    }

    if (matched) {
        return 'MATCHED' as const
    }

    return 'PENDING' as const
}

export const mapItemContributionStatusToLegacy = (
    status: ItemContributionStatus
) => {
    if (status === 'RECEIVED') {
        return 'RECEIVED'
    }

    if (status === 'REJECTED') {
        return 'REJECTED'
    }

    return 'PLEDGED'
}
