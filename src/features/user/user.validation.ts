import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createUserSchema: RequestValidationSchema = {
    body: z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(6).max(50),
        role: z.enum(['CLB', 'LCD', 'DOANTRUONG']),
        facultyId: z.number().int().positive().optional(),
    }),
}
