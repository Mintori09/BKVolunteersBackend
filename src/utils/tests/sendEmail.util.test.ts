import { sendResetCodeEmail, sendVerifyEmail } from '../sendEmail.util'

const mockSendMail = jest.fn()
const mockLoggerError = jest.fn()
const mockLoggerInfo = jest.fn()

jest.mock('src/config', () => ({
    transporter: {
        sendMail: (...args: unknown[]) => mockSendMail(...args),
    },
    config: {
        server: {
            url: 'http://localhost:3000',
        },
        email: {
            from: 'noreply@example.com',
        },
    },
}))

jest.mock('src/common/middleware', () => ({
    logger: {
        error: (...args: unknown[]) => mockLoggerError(...args),
        info: (...args: unknown[]) => mockLoggerInfo(...args),
    },
}))

describe('sendEmail.util', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('sendResetCodeEmail', () => {
        it('should call transporter.sendMail with correct mail options on success', () => {
            const email = 'user@example.com'
            const code = '123456'

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: null, info: { response: string }) => void
                ) => {
                    callback(null, { response: '250 OK' })
                }
            )

            sendResetCodeEmail(email, code)

            expect(mockSendMail).toHaveBeenCalled()
            const mailOptions = mockSendMail.mock.calls[0][0]
            expect(mailOptions).toMatchObject({
                from: 'noreply@example.com',
                to: email,
                subject: 'Đặt lại mật khẩu - Mã xác thực',
            })
            expect(mailOptions.html).toContain('123456')
        })

        it('should log error when sendMail fails', () => {
            const email = 'user@example.com'
            const code = '123456'
            const error = new Error('SMTP connection failed')

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: Error, info: null) => void
                ) => {
                    callback(error, null)
                }
            )

            sendResetCodeEmail(email, code)

            expect(mockLoggerError).toHaveBeenCalledWith(error)
        })

        it('should log info when sendMail succeeds', () => {
            const email = 'user@example.com'
            const code = '123456'

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: null, info: { response: string }) => void
                ) => {
                    callback(null, { response: '250 OK' })
                }
            )

            sendResetCodeEmail(email, code)

            expect(mockLoggerInfo).toHaveBeenCalledWith(
                'Reset password email sent: 250 OK'
            )
        })
    })

    describe('sendVerifyEmail', () => {
        it('should call transporter.sendMail with correct mail options on success', () => {
            const email = 'user@example.com'
            const token = 'verify-token-456'

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: null, info: { response: string }) => void
                ) => {
                    callback(null, { response: '250 OK' })
                }
            )

            sendVerifyEmail(email, token)

            expect(mockSendMail).toHaveBeenCalled()
            const mailOptions = mockSendMail.mock.calls[0][0]
            expect(mailOptions).toMatchObject({
                from: 'noreply@example.com',
                to: email,
                subject: 'Verify Your Email Address',
            })
            expect(mailOptions.html).toContain('verify-token-456')
            expect(mailOptions.html).toContain(
                'http://localhost:3000/verify-email?token=verify-token-456'
            )
        })

        it('should log error when sendMail fails', () => {
            const email = 'user@example.com'
            const token = 'verify-token-456'
            const error = new Error('SMTP authentication failed')

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: Error, info: null) => void
                ) => {
                    callback(error, null)
                }
            )

            sendVerifyEmail(email, token)

            expect(mockLoggerError).toHaveBeenCalledWith(error)
        })

        it('should log info when sendMail succeeds', () => {
            const email = 'user@example.com'
            const token = 'verify-token-456'

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: null, info: { response: string }) => void
                ) => {
                    callback(null, { response: '250 OK' })
                }
            )

            sendVerifyEmail(email, token)

            expect(mockLoggerInfo).toHaveBeenCalledWith(
                'Verify email sent: 250 OK'
            )
        })

        it('should handle undefined email address', () => {
            const email = undefined
            const token = 'verify-token-789'

            mockSendMail.mockImplementation(
                (
                    _options: unknown,
                    callback: (error: null, info: { response: string }) => void
                ) => {
                    callback(null, { response: '250 OK' })
                }
            )

            sendVerifyEmail(email, token)

            expect(mockSendMail).toHaveBeenCalled()
            const mailOptions = mockSendMail.mock.calls[0][0]
            expect(mailOptions.to).toBeUndefined()
        })
    })
})
