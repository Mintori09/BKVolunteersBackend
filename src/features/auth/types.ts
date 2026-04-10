export interface UserLoginCredentials {
    email: string
    password: string
}

export interface ChangePasswordData {
    oldPassword: string
    newPassword: string
    newPasswordConfirm: string
}
