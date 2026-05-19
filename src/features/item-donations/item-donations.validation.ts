import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const itemDonationModuleSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
}

export const createItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        item_target_id: z.string().regex(/^\d+$/),
        quantity: z.coerce.number().int().positive(),
        donor_name: z.string().trim().min(1).optional(),
        note: z.string().trim().optional(),
    }),
}

export const confirmItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}
