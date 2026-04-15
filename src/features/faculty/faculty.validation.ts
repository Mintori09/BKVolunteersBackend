import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createFacultySchema: RequestValidationSchema = {
    body: z.object({
        code: z
            .string()
            .length(3, 'Mã khoa phải có đúng 3 ký tự')
            .regex(
                /^[A-Z0-9]{3}$/,
                'Mã khoa chỉ được chứa chữ cái in hoa và số'
            ),
        name: z
            .string()
            .min(1, 'Tên khoa không được để trống')
            .max(255, 'Tên khoa không được quá 255 ký tự'),
    }),
}

export const updateFacultySchema: RequestValidationSchema = {
    body: z.object({
        code: z
            .string()
            .length(3, 'Mã khoa phải có đúng 3 ký tự')
            .regex(
                /^[A-Z0-9]{3}$/,
                'Mã khoa chỉ được chứa chữ cái in hoa và số'
            )
            .optional(),
        name: z
            .string()
            .min(1, 'Tên khoa không được để trống')
            .max(255, 'Tên khoa không được quá 255 ký tự')
            .optional(),
    }),
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
}

export const getFacultiesSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
        search: z.string().max(100).optional(),
    }),
}

export const facultyIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
}

export const facultyCodeSchema: RequestValidationSchema = {
    params: z.object({
        code: z.string().length(3),
    }),
}
