import nodemailer, { Transporter } from 'nodemailer'
import config from './config'
// const nodemailer = require('nodemailer')

const createFallbackTransporter = () =>
    nodemailer.createTransport({
        jsonTransport: true,
    })

export let transporter: Transporter = createFallbackTransporter()

const createTestAccount = async () => {
    try {
        const account = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
        })
        console.log(`Test account created: ${account.user}`)
    } catch (error) {
        console.error(`Failed to create a test account:`, error)
        console.warn(
            'Falling back to jsonTransport. Configure SENDGRID_API_KEY or SMTP_* in .env for real email delivery.'
        )
    }
}

if (config.sendgrid.is_configured) {
    transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: config.sendgrid.api_key,
        },
    })
    console.log('SMTP transporter created: SendGrid')
} else if (
    config.email.smtp.host !== 'localhost' &&
    config.email.smtp.auth.username !== 'test_user'
) {
    transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: parseInt(config.email.smtp.port),
        secure: parseInt(config.email.smtp.port) === 465, // Use secure if port is 465
        auth: {
            user: config.email.smtp.auth.username,
            pass: config.email.smtp.auth.password,
        },
    })
    console.log(`SMTP transporter created: ${config.email.smtp.host}`)
} else if (config.node_env === 'production') {
    transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: parseInt(config.email.smtp.port),
        secure: parseInt(config.email.smtp.port) === 465,
        auth: {
            user: config.email.smtp.auth.username,
            pass: config.email.smtp.auth.password,
        },
    })
} else {
    void createTestAccount()
}
