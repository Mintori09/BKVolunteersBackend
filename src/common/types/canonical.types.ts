export type AccountType = 'STUDENT' | 'OPERATOR'

export type OrganizationType = 'SCHOOL' | 'FACULTY_CLUB' | 'DEPARTMENT'

export interface ApiPagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

export interface PaginatedEnvelope<T> {
    items: T[]
    pagination: ApiPagination
}

