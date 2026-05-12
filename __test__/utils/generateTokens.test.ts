import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import jwt from 'jsonwebtoken'
import { config } from 'src/config'

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-token'),
}))

jest.mock('src/config', () => ({
    config: {
        jwt: {
            access_token: {
                secret: 'access-secret',
                expire: '15m',
            },
            refresh_token: {
                secret: 'refresh-secret',
                expire: '7d',
            },
        },
    },
}))

describe('generateTokens util', () => {
    it('should generate an access token', () => {
        const token = createAccessToken(
            'user123',
            'OPERATOR',
'SCHOOL_ADMIN',
            'org123',
            'faculty123'
        )
        expect(token).toBe('mock-token')
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                userId: 'user123',
                accountType: 'OPERATOR',
                role: 'SCHOOL_ADMIN',
                organizationId: 'org123',
                facultyId: 'faculty123',
            },
            'access-secret',
            { expiresIn: '15m' }
        )
    })

    it('should generate a refresh token', () => {
        const token = createRefreshToken('user123', 'STUDENT', 'STUDENT')
        expect(token).toBe('mock-token')
        expect(jwt.sign).toHaveBeenCalledWith(
            {
                userId: 'user123',
                accountType: 'STUDENT',
                role: 'STUDENT',
            },
            'refresh-secret',
            { expiresIn: '7d' }
        )
    })
})
