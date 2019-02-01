import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as serverless from 'aws-serverless-express/middleware'

import router from './router'


const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(serverless.eventContext())  // req.apiGateway.event
app.disable('x-powered-by')

app.use('/api', router())

export default app
