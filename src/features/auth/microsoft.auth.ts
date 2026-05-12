import { config } from 'src/config'
import * as authRepository from './auth.repository'
import * as authService from './auth.service'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

const STUDENT_EMAIL_DOMAIN = 'sv1.dut.udn.vn'

const MICROSOFT_SCOPES = 'openid profile email User.Read'

const STATE_COOKIE = 'microsoft_oauth_state'

export { STATE_COOKIE }

export function isMicrosoftEnabled(): boolean {
    return config.microsoft.isEnabled
}

export function generateState(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    for (let i = 0; i < 32; i++) {
        result += chars[array[i] % chars.length]
    }
    return result
}

export function getMicrosoftAuthUrl(state: string): string {
    const tenant = config.microsoft.tenant
    const params = new URLSearchParams({
        client_id: config.microsoft.clientId,
        response_type: 'code',
        redirect_uri: config.microsoft.callbackUrl,
        response_mode: 'query',
        scope: MICROSOFT_SCOPES,
        state,
    })
    return `${config.microsoft.authUrl}/${tenant}/oauth2/v2.0/authorize?${params.toString()}`
}

export async function getMicrosoftToken(code: string): Promise<{
    accessToken: string
    idToken: string
}> {
    const tenant = config.microsoft.tenant
    const body = new URLSearchParams({
        client_id: config.microsoft.clientId,
        client_secret: config.microsoft.clientSecret,
        code,
        redirect_uri: config.microsoft.callbackUrl,
        grant_type: 'authorization_code',
    })

    const response = await fetch(
        `${config.microsoft.tokenUrl}/${tenant}/oauth2/v2.0/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        },
    )

    if (!response.ok) {
        const errorBody = await response.text()
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Microsoft token exchange failed: ${errorBody}`,
        )
    }

    const data = (await response.json()) as {
        access_token: string
        id_token: string
    }

    return {
        accessToken: data.access_token,
        idToken: data.id_token,
    }
}

export async function getMicrosoftUser(
    accessToken: string,
): Promise<{ email: string; displayName: string }> {
    const response = await fetch(config.microsoft.graphApi, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Failed to fetch Microsoft user profile',
        )
    }

    const data = (await response.json()) as {
        mail?: string
        userPrincipalName?: string
        displayName?: string
    }

    const email = data.mail ?? data.userPrincipalName ?? ''
    const displayName = data.displayName ?? ''

    if (!email) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Microsoft account has no email',
        )
    }

    return { email, displayName }
}

const STUDENT_EMAIL_REGEX = /^(\d+)@sv1\.dut\.udn\.vn$/

export function parseStudentEmail(email: string): string | null {
    const match = email.match(STUDENT_EMAIL_REGEX)
    if (!match) return null
    return match[1]
}

export async function authorizeMicrosoftUser(
    email: string,
): Promise<{ accessToken: string; refreshToken: string }> {
    const mssv = parseStudentEmail(email)
    if (!mssv) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            `Email ${email} không hợp lệ. Phải có dạng <MSSV>@${STUDENT_EMAIL_DOMAIN}`,
        )
    }

    const student = await authRepository.getUserByMssv(mssv)
    if (!student) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            `Không tìm thấy sinh viên với MSSV ${mssv}`,
        )
    }

    return authService.createSession(student.id, 'STUDENT')
}
