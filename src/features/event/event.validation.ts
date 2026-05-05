import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

const datetimeSchema = z
    .string()
    .datetime({ message: 'Invalid datetime format' })

const cuidSchema = z.string().cuid('ID không hợp lệ')

const eventIdSchema = z.string().transform((val) => parseInt(val, 10))

export const createEventSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: cuidSchema,
    }),
    body: z
        .object({
            location: z
                .string()
                .min(1, 'Địa điểm là bắt buộc')
                .max(255, 'Địa điểm không được quá 255 ký tự'),
            maxParticipants: z
                .number()
                .int('Số lượng phải là số nguyên')
                .min(1, 'Số lượng tối đa phải lớn hơn 0'),
            registrationStart: datetimeSchema,
            registrationEnd: datetimeSchema,
            eventStart: datetimeSchema,
            eventEnd: datetimeSchema,
        })
        .refine(
            (data) =>
                new Date(data.registrationEnd) >
                new Date(data.registrationStart),
            {
                message: 'Hạn đăng ký kết thúc phải sau ngày bắt đầu đăng ký',
                path: ['registrationEnd'],
            }
        )
        .refine((data) => new Date(data.eventEnd) > new Date(data.eventStart), {
            message: 'Thời gian kết thúc sự kiện phải sau thời gian bắt đầu',
            path: ['eventEnd'],
        })
        .refine(
            (data) =>
                new Date(data.registrationEnd) < new Date(data.eventStart),
            {
                message: 'Hạn đăng ký phải trước ngày diễn ra sự kiện',
                path: ['registrationEnd'],
            }
        ),
}

export const updateEventSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: cuidSchema,
        eventId: eventIdSchema,
    }),
    body: z.object({
        location: z.string().min(1).max(255).optional(),
        maxParticipants: z.number().int().min(1).optional(),
        registrationStart: datetimeSchema.optional(),
        registrationEnd: datetimeSchema.optional(),
        eventStart: datetimeSchema.optional(),
        eventEnd: datetimeSchema.optional(),
    }),
}

export const deleteEventSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: cuidSchema,
        eventId: eventIdSchema,
    }),
}

export const getEventsByCampaignSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: cuidSchema,
    }),
}

export const getEventByIdSchema: RequestValidationSchema = {
    params: z.object({
        eventId: eventIdSchema,
    }),
}

export const registerEventSchema: RequestValidationSchema = {
    params: z.object({
        eventId: eventIdSchema,
    }),
}

export const cancelRegistrationSchema: RequestValidationSchema = {
    params: z.object({
        eventId: eventIdSchema,
    }),
}

export const getMyParticipantsSchema: RequestValidationSchema = {
    query: z.object({
        status: z
            .enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED'])
            .optional(),
        page: z
            .string()
            .transform((val) => parseInt(val, 10) || 1)
            .optional(),
        limit: z
            .string()
            .transform((val) => Math.min(parseInt(val, 10) || 10, 100))
            .optional(),
    }),
}

export const getParticipantsByEventSchema: RequestValidationSchema = {
    params: z.object({
        eventId: eventIdSchema,
    }),
    query: z.object({
        status: z
            .enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED'])
            .optional(),
        isCheckedIn: z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        page: z
            .string()
            .transform((val) => parseInt(val, 10) || 1)
            .optional(),
        limit: z
            .string()
            .transform((val) => Math.min(parseInt(val, 10) || 10, 100))
            .optional(),
    }),
}

export const approveParticipantSchema: RequestValidationSchema = {
    params: z.object({
        id: cuidSchema,
    }),
    body: z.object({
        comment: z.string().max(500).optional(),
    }),
}

export const rejectParticipantSchema: RequestValidationSchema = {
    params: z.object({
        id: cuidSchema,
    }),
    body: z.object({
        reason: z
            .string()
            .min(10, 'Lý do từ chối phải có ít nhất 10 ký tự')
            .max(500, 'Lý do từ chối không được quá 500 ký tự'),
    }),
}

export const checkInParticipantSchema: RequestValidationSchema = {
    params: z.object({
        id: cuidSchema,
    }),
}

export const sendCertificateSchema: RequestValidationSchema = {
    params: z.object({
        id: cuidSchema,
    }),
    body: z.object({
        certificateUrl: z.string().url('URL chứng nhận không hợp lệ'),
        points: z.number().int().min(0).optional(),
    }),
}

export const bulkCertificateSchema: RequestValidationSchema = {
    params: z.object({
        eventId: eventIdSchema,
    }),
    body: z.object({
        pointsPerParticipant: z.number().int().min(0).optional(),
    }),
}
