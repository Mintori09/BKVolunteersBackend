import nodemailer from 'nodemailer'
import config from '../config/config'

const testSMTP = async () => {
    console.log('--- SMTP Test ---')
    console.log(`Host: ${config.email.smtp.host}`)
    console.log(`Port: ${config.email.smtp.port}`)
    console.log(`User: ${config.email.smtp.auth.username}`)
    console.log(`From: ${config.email.from}`)

    const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: parseInt(config.email.smtp.port),
        secure: parseInt(config.email.smtp.port) === 465,
        auth: {
            user: config.email.smtp.auth.username,
            pass: config.email.smtp.auth.password,
        },
    })

    const mailOptions = {
        from: config.email.from,
        to: config.email.from,
        subject: 'SMTP Connection Test',
        text: 'This is a test email to verify SMTP configuration.',
        html: '<p>This is a <b>test email</b> to verify SMTP configuration.</p>',
    }

    try {
        console.log('Verifying connection...')
        await transporter.verify()
        console.log('Connection verified successfully!')

        console.log('Sending test email...')
        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent successfully!')
        console.log('Message ID:', info.messageId)
    } catch (error) {
        console.error('SMTP test failed:', error)
    }
}

testSMTP()
