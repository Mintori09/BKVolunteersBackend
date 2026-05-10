import { UserRole } from 'src/common/types'

declare module 'jsonwebtoken' {
    export interface JwtPayload {
        userId: string
        accountType: 'STUDENT' | 'OPERATOR'
        role: UserRole
        organizationId?: string | null
        facultyId?: string | null
    }
    export interface Jwt extends Record<string, unknown> {}
}
