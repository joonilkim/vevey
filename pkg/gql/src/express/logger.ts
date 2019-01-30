import * as express from 'express'
import * as pinoLogger from 'pino-http'
import { omitBy } from '@vevey/common'

export const logger = ({ env='development' }) => {
  const serializers = {
    req(req: express.Request){
      req.headers = omitBy(
        req.headers,
        (_, k: string) => /cloudfront|apigateway/.test(k))
      return req
    },
  }

  const prettier = { prettyPrint: { colorize: true } }

  return pinoLogger({
    ...(env === 'production' ? {} : prettier) ,
    serializers,
    level: env === 'test' ? 'error' : 'info',
  })
}
