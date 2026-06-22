import { type CorsOptions } from 'cors'
import config from './config'

const whiteList = String(config.cors.cors_origin).split('|') ?? []

const corsConfig: Readonly<CorsOptions> = {
    origin(
        origin: string | undefined,
        callback: (
            err: Error | null,
            origin?:
                | boolean
                | string
                | RegExp
                | Array<boolean | string | RegExp>
        ) => void
    ) {
        if (!origin || whiteList.includes('*') || whiteList.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    maxAge: 86400,
    allowedHeaders: [
        'Accept',
        'Authorization',
        'Content-Type',
        'If-None-Match',
        'BX-User-Token',
        'Trace-Id',
    ],
    exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    credentials: true,
} as CorsOptions

export default corsConfig
