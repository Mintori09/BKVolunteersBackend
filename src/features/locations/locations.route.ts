import { Router } from 'express'
import { listLocations } from './locations.controller'

const locationsRouter = Router()

locationsRouter.get('/', listLocations)

export default locationsRouter

