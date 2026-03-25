import * as z from 'zod'

export const sendVerifyEmailSchema = {
    body: z.object({
        email: z.string().email('Email is invalid!'),
    }),
}
export const verifyEmailSchema = {
    params: z.object({
        token: z
            .string()
            .regex(
                /^([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
                'Invalid token format'
            ),
    }),
}
