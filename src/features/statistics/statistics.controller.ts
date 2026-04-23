import { Response, Request } from 'express'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as statisticsService from './statistics.service'

export const getSystemStatistics = catchAsync(
    async (_req: Request, res: Response) => {
        const result = await statisticsService.getSystemStatistics()

        return ApiResponse.success(res, result)
    }
)
