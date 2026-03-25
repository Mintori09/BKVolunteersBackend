import type { Sanitized, SanitizeOptions } from 'src/types/common'
import xss from 'xss'

export const sanitize = <T extends unknown>(
    data: T,
    options?: SanitizeOptions
): Sanitized<T> => {
    if (!data) {
        return data as unknown as Sanitized<T>
    }

    if (Array.isArray(data)) {
        const sanitizedArray = data.map((item) => {
            return sanitize(item, options)
        }) as unknown as Sanitized<T>

        return sanitizedArray
    }

    if (typeof data === 'object' && data !== null) {
        const sanitizedObject = {} as { [K in keyof T]: Sanitized<T[K]> }
        for (const [key, value] of Object.entries(data)) {
            sanitizedObject[key as keyof T] = sanitize(value, options)
        }
        return sanitizedObject as Sanitized<T>
    }

    if (typeof data === 'string') {
        const xssOptions: SanitizeOptions = {
            stripIgnoreTagBody: options?.stripIgnoreTagBody ?? false,
            whiteList: options?.whiteList ?? {},
            ...options,
        }
        return xss(data, xssOptions) as Sanitized<T>
    }

    return data as Sanitized<T>
}
