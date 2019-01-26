import * as express from 'express'
import * as graphql from 'express-graphql'
import { formatError } from 'graphql'
import { omitBy, pick } from 'lodash'
import * as pinoLogger from 'pino-http'

import { schema } from './graphql'
import { Note } from './models/Note'
import { Context } from './Context'


export default function() {
  const env = process.env.NODE_ENV || 'development'

  const router = express.Router()

  //// logger ////

  const serializers = {
    req(req: express.Request){
      req.headers = omitBy(
        req.headers,
        (_, k: string) => /cloudfront|apigateway/.test(k))
      return req
    },
  }

  router.use(
    pinoLogger({
      prettyPrint: { colorize: true },
      serializers,
      level: env === 'test' ? 'error' : 'info',
    }),
  )

  //// Models ////

  //// Authentication ////

  router.use((req, res, next) => {
    const id = req.get('Authorization')
    req['user'] = { id }
    next()
  })


  //// grapql ////

  router.use('/gql', function(req, res, next){
    if(env !== 'production'){
      req.log.debug(
        pick(req, ['path', 'query', 'body']))
    }

    // Create per every request
    const context: Context = {
      me: req['user'],
      Note,
    }

    return graphql({
      schema,
      graphiql: env === 'development',
      context,
      formatError(err){
        // When error is occured, graphql composes its response, instead of
        // forwarding errors to last.
        // So, log errors in here.
        req.log.error({ err })
        return formatError(err)
      },
    })(req, res)
    .catch(next)
  })


  //// rest api ////

  router.get('/users', (_, res) => {
    res.json([
      {id: 1, name: 'Joe'},
    ])
  })

  return router
}
