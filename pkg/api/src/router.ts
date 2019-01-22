import * as AWS from 'aws-sdk'
import * as express from 'express'
import * as graphql from 'express-graphql'
import { formatError } from 'graphql'
import { omitBy, pick } from 'lodash'
import * as pinoLogger from 'pino-http'

import { Context } from './context'
import schema from './schema'

export default function({ env }) {
  const router = express.Router()

  const db = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-10-08',
  })


  //// logger ////

  const serializers = {
    req(req){
      req.headers = omitBy(
        req.headers, (_, k) => /cloudfront|apigateway/.test(k))
      return req
    }
  }

  router.use(pinoLogger({
    prettyPrint: { colorize: true },
    serializers,
    level: env === 'test' ? 'error' : 'info'
  }))


  //// grapql ////

  router.use('/gql', function(req, res, next){
    if(env !== 'production'){
      req.log.debug(pick(req, ['path', 'query', 'body']))
    }

    const user = {}

    return graphql({
      schema,
      graphiql: env === 'development',
      context: new Context({ env, user }, {}),
      formatError(err){
        req.log.error({ err })
        return formatError(err)
      },
    })(req, res)
    .catch(next)
  })


  //// rest api ////

  const users = [{
    id: 1,
    name: 'Joe',
  }, {
    id: 2,
    name: 'Jane',
  }]

  router.get('/users', (_, res) => {
    res.json(users)
  })

  return router
}
