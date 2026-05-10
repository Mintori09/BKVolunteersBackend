export interface OrganizationListQuery {
    page?: number
    limit?: number
}

export interface OrganizationFacultySummary {
    id: number
    code: string
    name: string
}

export interface OrganizationListItemOutput {
    id: number
    code: string
    name: string
    type: string
    status: string
    faculty: OrganizationFacultySummary | null
}

export interface OrganizationListOutput {
    items: OrganizationListItemOutput[]
}
