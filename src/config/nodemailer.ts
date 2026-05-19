import nodemailer, { Transporter } from 'nodemailer'
import config from './config'
// const nodemailer = require('nodemailer')

let transporter: Transporter | null = null

if (
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
    transporter = nodemailer.createTransport({ jsonTransport: true })
}

export default transporter
