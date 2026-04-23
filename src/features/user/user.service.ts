import * as argon2 from 'argon2'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as userRepository from './user.repository'
import { CreateUserInput, UserActor } from './types'

export const createUser = async (data: CreateUserInput, actor: UserActor) => {
    if (actor.role !== 'DOANTRUONG') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Bạn không có quyền tạo tài khoản')
    }

    const existingUsername = await userRepository.findByUsername(data.username)
    if (existingUsername) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Username đã tồn tại')
    }

    const existingEmail = await userRepository.findByEmail(data.email)
    if (existingEmail) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Email đã tồn tại')
    }

    const hashedPassword = await argon2.hash(data.password)

    return userRepository.createUser({
        ...data,
        password: hashedPassword,
    })
}
