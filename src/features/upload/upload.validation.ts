import { RequestValidationSchema } from 'src/types/request'
import { z } from 'zod'

export const uploadImageValidation: RequestValidationSchema = {
    body: z.object({}),
}

export const uploadDocumentValidation: RequestValidationSchema = {
    body: z.object({}),
}
