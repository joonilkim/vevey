import * as awsServerlessExpress from 'aws-serverless-express'
import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { app } from './app'

const server = awsServerlessExpress.createServer(app)

let handler = function(
  event: APIGatewayProxyEvent, context: Context
): Promise<APIGatewayProxyResult> {
  return awsServerlessExpress.proxy(
    server, event, context, 'PROMISE').promise
}

export {
  handler
}
