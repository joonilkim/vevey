import * as awsServerlessExpress from 'aws-serverless-express'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda'

import { app } from './app'

export const server = awsServerlessExpress.createServer(app)

export function handler(
  event: APIGatewayProxyEvent, context: Context
): Promise<APIGatewayProxyResult> {
  return awsServerlessExpress.proxy(
    server, event, context, 'PROMISE').promise
}
