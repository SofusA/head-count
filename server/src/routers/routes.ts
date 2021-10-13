import express from 'express'
let router = express.Router()

import {router as clientRouter} from './clientRoutes'
import {router as apiRouter} from './apiRoutes'

router
.use('/', clientRouter)
.use('/count', apiRouter)

export { router }