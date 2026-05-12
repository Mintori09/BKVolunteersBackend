import { logger } from 'src/common/middleware'
import { transporter, config } from 'src/config'

export const sendResetCodeEmail = (email: string, code: string) => {
    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Đặt lại mật khẩu - Mã xác thực',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333; text-align: center;">Đặt lại mật khẩu</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Bạn vừa yêu cầu đặt lại mật khẩu. Mã xác thực của bạn là:</p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; display: inline-block;">${code}</div>
            </div>
            <p style="color: #777; font-size: 14px; text-align: center;">Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} BK Volunteers. All rights reserved.</p>
        </div>
    `,
    }
    console.log('Reset Code:', code)
    logger.info(`Reset code sent to ${email}: ${code}`)
    transporter?.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else {
            logger.info('Reset password email sent: ' + info.response)
        }
    })
}

export const sendVerifyEmail = (email: string | undefined, token: string) => {
    const verifyLink = `${config.server.url}/verify-email?token=${encodeURIComponent(token)}`
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
