export const v4 = jest.fn().mockReturnValue('mock-uuid-v4')
export const v1 = jest.fn().mockReturnValue('mock-uuid-v1')
export const v3 = jest.fn().mockReturnValue('mock-uuid-v3')
export const v5 = jest.fn().mockReturnValue('mock-uuid-v5')
export const v6 = jest.fn().mockReturnValue('mock-uuid-v6')
export const v7 = jest.fn().mockReturnValue('mock-uuid-v7')
export const validate = jest.fn().mockReturnValue(true)
export const version = jest.fn().mockReturnValue(4)
export const parse = jest.fn()
export const stringify = jest.fn()
export const NIL = '00000000-0000-0000-0000-000000000000'
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
export default {
    v4,
    v1,
    v3,
    v5,
    v6,
    v7,
    validate,
    version,
    parse,
    stringify,
    NIL,
    MAX,
}
