import { HttpStatus } from 'src/common/constants'
import { config } from 'src/config'
import { ApiError } from 'src/utils/ApiError'

type SepayEnvelope<T> = {
    status: string
    message?: string
    data: T
    meta?: Record<string, unknown>
}

type SepayRequestOptions = {
    method?: 'GET' | 'POST'
    query?: Record<string, string | number | undefined>
    body?: Record<string, unknown>
}

const buildBaseUrl = () => {
    if (!config.sepay.apiEnabled || !config.sepay.apiToken) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'SePay API chưa được cấu hình hoặc chưa bật'
        )
    }

    if (config.sepay.apiBaseUrl) {
        return config.sepay.apiBaseUrl.replace(/\/$/, '')
    }

    return config.sepay.apiMode === 'live'
        ? 'https://userapi.sepay.vn/v2'
        : 'https://userapi-sandbox.sepay.vn/v2'
}

const buildQuery = (query?: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams()
    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return
        }
        params.set(key, String(value))
    })

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
}

const mapSepayError = async (response: Response) => {
    const text = await response.text()
    const status = response.status

    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        throw new ApiError(HttpStatus.BAD_GATEWAY, 'SePay API xác thực thất bại')
    }

    if (status === 429) {
        throw new ApiError(HttpStatus.TOO_MANY_REQUESTS, 'SePay API rate limited')
    }

    throw new ApiError(
        HttpStatus.BAD_GATEWAY,
        `SePay API lỗi ${status}${text ? `: ${text}` : ''}`
    )
}

const request = async <T>(
    path: string,
    options?: SepayRequestOptions
): Promise<SepayEnvelope<T>> => {
    const baseUrl = buildBaseUrl()
    const response = await fetch(`${baseUrl}${path}${buildQuery(options?.query)}`, {
        method: options?.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${config.sepay.apiToken}`,
            'Content-Type': 'application/json',
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
        await mapSepayError(response)
    }

    return (await response.json()) as SepayEnvelope<T>
}

export const listBankAccounts = async (query?: Record<string, string | number | undefined>) =>
    request<any[]>('/bank-accounts', { query })

export const listTransactions = async (query?: Record<string, string | number | undefined>) =>
    request<any[]>('/transactions', { query })

export const getTransaction = async (transactionId: string) =>
    request<any>(`/transactions/${transactionId}`)

export const listVirtualAccounts = async (
    bankAccountId: string,
    query?: Record<string, string | number | undefined>
) => request<any[]>(`/bank-accounts/${bankAccountId}/va`, { query })

export const createOrder = async (
    bankAccountId: string,
    body: Record<string, unknown>
) => request<any>(`/bank-accounts/${bankAccountId}/orders`, { method: 'POST', body })

export const getOrder = async (bankAccountId: string, orderId: string) =>
    request<any>(`/bank-accounts/${bankAccountId}/orders/${orderId}`)

export const createOrderVirtualAccount = async (
    bankAccountId: string,
    orderId: string,
    body: Record<string, unknown>
) =>
    request<any>(`/bank-accounts/${bankAccountId}/orders/${orderId}/va`, {
        method: 'POST',
        body,
    })
