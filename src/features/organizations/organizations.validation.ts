import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const listOrganizationsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
}
