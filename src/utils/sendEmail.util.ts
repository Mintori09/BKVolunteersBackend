import { logger } from 'src/common/middleware'
import { transporter, config } from 'src/config'

export const sendResetEmail = (email: string, token: string) => {
    const resetLink = `${config.server.url}/api/v1/password/reset-password/${token}`
    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Reset Your Password',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">You recently requested to reset your password for your account. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #777; font-size: 14px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">This link will expire in 1 hour.</p>
        </div>
    `,
    }
    console.log('Reset Link:', resetLink)
    transporter?.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else {
            logger.info('Reset password email sent: ' + info.response)
        }
    })
}

export const sendVerifyEmail = (email: string | undefined, token: string) => {
    const verifyLink = `${config.server.url}/api/v1/verify-email/${token}`
    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Welcome!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Thank you for signing up. To complete your registration and verify your email address, please click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #777; font-size: 14px; text-align: center;">If you did not create an account, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
        </div>
    `,
    }
    console.log('Verify Link:', verifyLink)
    transporter?.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else {
            logger.info('Verify email sent: ' + info.response)
        }
    })
}
