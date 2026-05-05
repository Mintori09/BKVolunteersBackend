import { Request } from 'express'
import { DeepPartial } from 'utility-types'
import { RequireAtLeastOne } from './common'
import * as z from 'zod'

export type TypedRequest<
    ReqBody = Record<string, unknown>,
    QueryString = Record<string, unknown>,
> = Request<
    Record<string, unknown>,
    Record<string, unknown>,
    DeepPartial<ReqBody>,
    DeepPartial<QueryString>
>

export type RequestValidationSchema = RequireAtLeastOne<{
    body?: z.ZodObject<any, any>
    query?: z.ZodObject<any, any>
    params?: z.ZodObject<any, any>
}>
