import { NextFunction } from 'express'
import * as userController from '../user.controller'
import * as userService from '../user.service'
import { HttpStatus } from 'src/common/constants'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
    },
}))

jest.mock('../user.service')

describe('User Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            payload: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createUser', () => {
        it('should create a user via DOANTRUONG context', async () => {
            req.payload = { userId: 'admin-1', role: 'DOANTRUONG' }
            req.body = {
                username: 'clb01',
                email: 'clb01@example.com',
                password: 'Password123!',
                role: 'CLB',
                facultyId: 1,
            }
            ;(userService.createUser as jest.Mock).mockResolvedValue({
                id: 'user-1',
                username: 'clb01',
                email: 'clb01@example.com',
                role: 'CLB',
                facultyId: 1,
            })

            await userController.createUser(req, res, next)

            expect(userService.createUser).toHaveBeenCalledWith(req.body, {
                userId: 'admin-1',
                role: 'DOANTRUONG',
            })
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(res.json).toHaveBeenCalled()
        })
    })
})
