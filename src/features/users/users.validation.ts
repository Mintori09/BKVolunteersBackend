import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

const userRoleSchema = z.enum(['SINHVIEN', 'LCD', 'CLB', 'DOANTRUONG'])
const userStatusSchema = z.enum(['ACTIVE', 'LOCKED', 'DISABLED'])

const emailSchema = z.email('Email khong hop le')
const passwordSchema = z
    .string()
    .min(8, 'Mat khau phai co it nhat 8 ky tu')
    .max(150, 'Mat khau khong duoc qua 150 ky tu')
const optionalPasswordSchema = z
    .string()
    .min(8, 'Mat khau phai co it nhat 8 ky tu')
    .max(150, 'Mat khau khong duoc qua 150 ky tu')
    .optional()
const usernameSchema = z
    .string()
    .min(3, 'Username phai co it nhat 3 ky tu')
    .max(50, 'Username khong duoc qua 50 ky tu')
const mssvSchema = z
    .string()
    .regex(/^1\d{8}$/, 'MSSV phai gom 9 chu so va bat dau bang 1')
const fullNameSchema = z
    .string()
    .min(2, 'Ho ten phai co it nhat 2 ky tu')
    .max(255, 'Ho ten khong duoc qua 255 ky tu')
const facultyIdSchema = z.coerce
    .number()
    .int('FacultyId phai la so nguyen')
    .positive('FacultyId phai lon hon 0')
const managedClubIdSchema = z.uuid('Club id khong hop le').optional()

export const listUsersSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        search: z.string().max(100).optional(),
        role: userRoleSchema.optional(),
        status: userStatusSchema.optional(),
    }),
}

export const createUserSchema: RequestValidationSchema = {
    body: z.discriminatedUnion('role', [
        z.object({
            role: z.literal('SINHVIEN'),
            email: emailSchema,
            password: passwordSchema,
            mssv: mssvSchema,
            fullName: fullNameSchema,
            facultyId: facultyIdSchema,
            className: z.string().max(50).optional(),
            phone: z.string().max(20).optional(),
        }),
        z.object({
            role: z.literal('LCD'),
            username: usernameSchema,
            email: emailSchema,
            password: passwordSchema,
            facultyId: facultyIdSchema,
        }),
        z.object({
            role: z.literal('CLB'),
            username: usernameSchema,
            email: emailSchema,
            password: passwordSchema,
            facultyId: facultyIdSchema.optional(),
            managedClubId: managedClubIdSchema,
        }),
        z.object({
            role: z.literal('DOANTRUONG'),
            username: usernameSchema,
            email: emailSchema,
            password: passwordSchema,
        }),
    ]),
}

export const updateUserSchema: RequestValidationSchema = {
    params: z.object({
        userId: z.uuid('User id khong hop le'),
    }),
    body: z.discriminatedUnion('role', [
        z.object({
            role: z.literal('SINHVIEN'),
            email: emailSchema,
            password: optionalPasswordSchema,
            mssv: mssvSchema,
            fullName: fullNameSchema,
            facultyId: facultyIdSchema,
            className: z.string().max(50).optional(),
            phone: z.string().max(20).optional(),
        }),
        z.object({
            role: z.literal('LCD'),
            username: usernameSchema,
            email: emailSchema,
            password: optionalPasswordSchema,
            facultyId: facultyIdSchema,
        }),
        z.object({
            role: z.literal('CLB'),
            username: usernameSchema,
            email: emailSchema,
            password: optionalPasswordSchema,
            facultyId: facultyIdSchema.optional(),
            managedClubId: managedClubIdSchema,
        }),
        z.object({
            role: z.literal('DOANTRUONG'),
            username: usernameSchema,
            email: emailSchema,
            password: optionalPasswordSchema,
        }),
    ]),
}

export const updateUserStatusSchema: RequestValidationSchema = {
    params: z.object({
        userId: z.uuid('User id khong hop le'),
    }),
    body: z.object({
        status: z.enum(['ACTIVE', 'LOCKED']),
    }),
}

export const userIdParamsSchema: RequestValidationSchema = {
    params: z.object({
        userId: z.uuid('User id khong hop le'),
    }),
}
