export interface UserSignUpCredentials {
    firstName: string
    lastName: string
    username: string
    email: string
    password: string
    passwordConfirmed: string
}

export interface UserLoginCredentials {
    email: string
    password: string
}

export interface ChangePasswordData {
    oldPassword: string
    newPassword: string
    newPasswordConfirm: string
}
