import { AccountType, ContractRole } from 'src/contract/types'

declare module 'jsonwebtoken' {
    export interface JwtPayload {
        userId: string
        accountType: AccountType
        role: ContractRole
        organizationId?: string | null
        facultyId?: string | null
    }
    export interface Jwt extends Record<string, unknown> {}
}
