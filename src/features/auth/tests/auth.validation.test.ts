import { describe, it, expect } from '@jest/globals'
import { loginSchema, changePasswordSchema, refreshSchema, logoutSchema } from '../auth.validation'

describe('loginSchema', () => {
    const schema = loginSchema.body!

    it('should accept valid MSSV and password', () => {
        const result = schema.safeParse({ identifier: '102210001', password: 'secret123' })
        expect(result.success).toBe(true)
    })

    it('should accept valid email and password', () => {
        const result = schema.safeParse({ identifier: 'student@dut.udn.vn', password: 'secret123' })
        expect(result.success).toBe(true)
    })

    it('should reject empty identifier', () => {
        const result = schema.safeParse({ identifier: '', password: 'secret123' })
        expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
        const result = schema.safeParse({ identifier: '102210001', password: '12345' })
        expect(result.success).toBe(false)
    })

    it('should reject long password', () => {
        const result = schema.safeParse({ identifier: '102210001', password: 'a'.repeat(51) })
        expect(result.success).toBe(false)
    })

    it('should reject invalid MSSV with wrong length', () => {
        const result = schema.safeParse({ identifier: '12345678', password: 'secret123' })
        expect(result.success).toBe(false)
    })

    it('should reject invalid email format', () => {
        const result = schema.safeParse({ identifier: 'not-an-email', password: 'secret123' })
        expect(result.success).toBe(false)
    })
})

describe('changePasswordSchema', () => {
    const schema = changePasswordSchema.body!

    it('should accept valid password change', () => {
        const result = schema.safeParse({
            oldPassword: 'oldpass123',
            newPassword: 'newpass123',
            newPasswordConfirm: 'newpass123',
        })
        expect(result.success).toBe(true)
    })

    it('should reject when passwords do not match', () => {
        const result = schema.safeParse({
            oldPassword: 'oldpass123',
            newPassword: 'newpass123',
            newPasswordConfirm: 'different',
        })
        expect(result.success).toBe(false)
    })

    it('should reject short new password', () => {
        const result = schema.safeParse({
            oldPassword: 'oldpass123',
            newPassword: 'short',
            newPasswordConfirm: 'short',
        })
        expect(result.success).toBe(false)
    })

    it('should reject empty old password', () => {
        const result = schema.safeParse({
            oldPassword: '',
            newPassword: 'newpass123',
            newPasswordConfirm: 'newpass123',
        })
        expect(result.success).toBe(false)
    })
})

describe('refreshSchema', () => {
    const schema = refreshSchema.body!

    it('should accept valid refresh token', () => {
        const result = schema.safeParse({ refresh_token: 'some-token-value' })
        expect(result.success).toBe(true)
    })

    it('should reject empty refresh token', () => {
        const result = schema.safeParse({ refresh_token: '' })
        expect(result.success).toBe(false)
    })
})

describe('logoutSchema', () => {
    const schema = logoutSchema.body!

    it('should accept optional refresh token', () => {
        const result = schema.safeParse({ refresh_token: 'some-token' })
        expect(result.success).toBe(true)
    })

    it('should accept empty body', () => {
        const result = schema.safeParse({})
        expect(result.success).toBe(true)
    })
})
