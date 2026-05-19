import compression from 'compression'

import type { Request, Response } from 'express'

const compressFilter = (req: Request, res: Response): boolean => {
    if (req.headers['x-no-compression']) {
        return false
    }

    return compression.filter(req, res)
}

export default compressFilter
