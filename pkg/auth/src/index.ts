import * as Promise from 'bluebird'
global.Promise = Promise

import * as awsServerlessExpress from 'aws-serverless-express'
import {
  APIGatewayProxyEvent,
  Context,
} from 'aws-lambda'

import { app } from './app'

export const server = awsServerlessExpress.createServer(app)

export function handler(
  event: APIGatewayProxyEvent, context: Context
) {
  return awsServerlessExpress.proxy(
    server, event, context, 'PROMISE').promise
}
