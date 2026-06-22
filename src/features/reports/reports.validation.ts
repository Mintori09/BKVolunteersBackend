import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const campaignReportSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const schoolOverviewSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
    }),
}
