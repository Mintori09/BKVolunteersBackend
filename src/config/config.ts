import * as dotenv from 'dotenv'
import * as z from 'zod'

dotenv.config()

const envSchema = z.object({
    NODE_ENV: z
        .literal(['development', 'test', 'production'])
        .default('development'),
    PORT: z.string().default('4000'),
    SERVER_URL: z.string().optional(),
    CORS_ORIGIN: z.string().default('*'),
    ACCESS_TOKEN_SECRET: z
        .string()
        .min(8, 'ACCESS_TOKEN_SECRET require min 8 chars')
        .default('test_access_token_secret'),
    ACCESS_TOKEN_EXPIRE: z.string().default('20m'),
    REFRESH_TOKEN_SECRET: z
        .string()
        .min(8, 'ACCESS_TOKEN_SECRET require min 8 chars')
        .default('test_refresh_token_secret'),

    REFRESH_TOKEN_EXPIRE: z.string().default('1d'),
    REFRESH_TOKEN_COOKIE_NAME: z.string().default('min'),
    MYSQL_DATABASE: z.string().default('test_db'),
    MYSQL_ROOT_PASSWORD: z.string().default('test_password'),
    DATABASE_URL: z
        .string()
        .default('mysql://root:test_password@localhost:3306/test_db'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z
        .string()
        .regex(/^\d+$/, 'SMTP_PORT require number!')
        .default('587'),
    SMTP_USERNAME: z.string().default('test_user'),
    SMTP_PASSWORD: z.string().default('test_password'),
    EMAIL_FROM: z.email('EMAIL NOT VALID!').default('test@example.com'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('Configuration .env is not valid!')
    parsedEnv.error.issues.forEach((issue) => {
        console.error(` - [${issue.path.join('.')}]: ${issue.message}`)
    })
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1)
    }
}

const env = parsedEnv.success
    ? parsedEnv.data
    : ({} as z.infer<typeof envSchema>)

const config = {
    node_env: env.NODE_ENV,
    server: {
        port: env.PORT,
        url: env.SERVER_URL ? env.SERVER_URL : `http://localhost:${env.PORT}`,
    },
    cors: {
        cors_origin: env.CORS_ORIGIN,
    },
    jwt: {
        access_token: {
            secret: env.ACCESS_TOKEN_SECRET,
            expire: env.ACCESS_TOKEN_EXPIRE,
        },
        refresh_token: {
            secret: env.REFRESH_TOKEN_SECRET,
            expire: env.REFRESH_TOKEN_EXPIRE,
            cookie_name: env.REFRESH_TOKEN_COOKIE_NAME,
        },
    },
    email: {
        smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            auth: {
                username: env.SMTP_USERNAME,
                password: env.SMTP_PASSWORD,
            },
        },
        from: env.EMAIL_FROM,
    },
    database_url: env.DATABASE_URL,
} as const

export default config
