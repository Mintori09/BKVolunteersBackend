import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const getMyNotificationsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
    }),
}

export const notificationIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1),
    }),
}
