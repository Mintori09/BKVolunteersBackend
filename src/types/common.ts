import { IFilterXSSOptions } from 'xss'

/**
 * Ensures that at least one property of T is present.
 */
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> &
        Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

/**
 * Recursively makes all properties of T readonly and handles nested objects.
 */
export type Sanitized<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends object
      ? {
            readonly [K in keyof T]: Sanitized<T[K]>
        }
      : T

export type SanitizeOptions = IFilterXSSOptions & {
    whiteList?: IFilterXSSOptions['whiteList']
}

export interface EmailRequestBody {
    email: string
}
