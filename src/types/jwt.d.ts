declare module 'jsonwebtoken' {
    export interface JwtPayload {
        userId: string
        role: string
        subjectType?: 'user' | 'student' | 'manager'
        roleType?: 'CLB_MANAGER' | 'LCD_MANAGER' | 'DOANTRUONG_ADMIN'
        facultyId?: number | null
        clubId?: string | null
    }
    export interface Jwt {}
}
