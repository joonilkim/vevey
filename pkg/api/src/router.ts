import * as assert from 'assert'
import * as express from 'express'
import * as graphql from 'express-graphql'
import { omitBy } from 'lodash'
import * as pinoLogger from 'pino-http'

import { schema, formatError } from './graphql'
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
    assert(!['null', 'undefined'].includes(id))

    req['user'] = { id }
    next()
  })


  //// grapql ////

  router.use('/gql', function(req, res, next){
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
        const er = err['originalError'] || err
        const isUserError = !err['originalError'] || er['isUserError']
        const level = isUserError ? 'info' : 'error'
        req.log[level]({ err })
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
