export function isMssv(username: string): boolean {
    // MSSV format: 9 digits starting with 1
    const mssvRegex = /^1\d{8}$/
    return mssvRegex.test(username) && !isNaN(Number(username))
}
