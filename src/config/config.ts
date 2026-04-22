import * as dotenv from 'dotenv'
import * as z from 'zod'

dotenv.config()
dotenv.config({ path: 'sendgrid.env', override: false })

const emptyStringToUndefined = (value: unknown) => {
    if (typeof value !== 'string') {
        return value
    }

    const trimmedValue = value.trim()
    return trimmedValue === '' ? undefined : trimmedValue
}

const optionalString = z.preprocess(
    emptyStringToUndefined,
    z.string().optional()
)

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.string().default('4000'),
    SERVER_URL: optionalString,
    FRONTEND_URL: z.string().default('http://localhost:3000'),
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
    SENDGRID_API_KEY: z.string().default(''),
    CLOUDINARY_CLOUD_NAME: z.string().default(''),
    CLOUDINARY_API_KEY: z.string().default(''),
    CLOUDINARY_API_SECRET: z.string().default(''),
    CLOUDINARY_BASE_FOLDER: z.string().default('bk-volunteers'),
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
    frontend: {
        url: env.FRONTEND_URL,
        login_url: new URL('/auth/login', env.FRONTEND_URL).toString(),
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
    sendgrid: {
        api_key: env.SENDGRID_API_KEY,
        is_configured: Boolean(env.SENDGRID_API_KEY),
    },
    cloudinary: {
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        base_folder: env.CLOUDINARY_BASE_FOLDER,
        is_configured: Boolean(
            env.CLOUDINARY_CLOUD_NAME &&
                env.CLOUDINARY_API_KEY &&
                env.CLOUDINARY_API_SECRET
        ),
    },
    database_url: env.DATABASE_URL,
} as const

export default config
