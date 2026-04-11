import { UserRole } from 'src/features/auth/types'

declare module 'jsonwebtoken' {
    export interface JwtPayload {
        userId: string
        role: UserRole
    }
    export interface Jwt extends Record<string, unknown> {}
}
