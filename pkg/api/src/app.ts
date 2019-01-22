import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as serverless from 'aws-serverless-express/middleware'

import { env } from './config'
import router from './router'


const app = express()

//// middlewares ////

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// get event object by `req.apiGateway.event`
app.use(serverless.eventContext())
app.disable('x-powered-by')

app.use('/api', router({ env }))

export default app
