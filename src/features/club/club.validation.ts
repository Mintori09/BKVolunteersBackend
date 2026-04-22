import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createClubSchema: RequestValidationSchema = {
    body: z.object({
        name: z
            .string()
            .min(1, 'Tên CLB không được để trống')
            .max(255, 'Tên CLB không được quá 255 ký tự'),
        facultyId: z.number().int().positive().optional(),
        leaderId: z.string().min(1).optional(),
    }),
}

export const updateClubSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        name: z
            .string()
            .min(1, 'Tên CLB không được để trống')
            .max(255, 'Tên CLB không được quá 255 ký tự')
            .optional(),
        facultyId: z.number().int().positive().nullable().optional(),
        leaderId: z.string().min(1).nullable().optional(),
    }),
}

export const getClubsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        facultyId: z.coerce.number().int().positive().optional(),
        search: z.string().max(100).optional(),
    }),
}

export const clubIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
}
