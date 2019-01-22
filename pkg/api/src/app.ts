import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as pinoLogger from 'pino-http'
import * as serverless from 'aws-serverless-express/middleware'
import { omitBy } from 'lodash'

import { env } from './config'
import router from './router'


const app = express()

//// logger ////

const serializers = {
  req(req){
    req.headers = omitBy(
      req.headers, (_, k) => /cloudfront|apigateway/.test(k))
    return req
  }
}

if(env !== 'test'){
  app.use(pinoLogger({
    prettyPrint: { colorize: true },
    serializers,
  }))
}

//// middlewares ////

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// get event object by `req.apiGateway.event`
app.use(serverless.eventContext())
app.disable('x-powered-by')

app.use('/api', router({ env }))

export default app
