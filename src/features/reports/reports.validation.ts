import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const campaignReportSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const campaignReconciliationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const schoolOverviewSchema: RequestValidationSchema = {
    query: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        organization_id: z.string().regex(/^\d+$/).optional(),
        module_type: z.string().trim().min(1).optional(),
        status: z.string().trim().min(1).optional(),
    }),
}
