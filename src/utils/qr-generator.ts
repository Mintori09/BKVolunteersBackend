export const generateVietQrUrl = (
    bankCode: string,
    bankAccountNo: string,
    bankAccountName: string,
    amount?: number
): string => {
    const encodedName = encodeURIComponent(bankAccountName)
    let url = `https://img.vietqr.io/image/${bankCode}-${bankAccountNo}-compact.png?accountName=${encodedName}`

    if (amount) {
        url += `&amount=${amount}`
    }

    return url
}
