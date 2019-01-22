import * as AWS from 'aws-sdk'
import * as express from 'express'
import * as graphql from 'express-graphql'
import { formatError } from 'graphql'
import { pick } from 'lodash'
import * as pino from 'pino'

import { Context } from './context'
import schema from './schema'

export default function({ env }) {
  const router = express.Router()

  const db = new AWS.DynamoDB({apiVersion: '2012-10-08'})

  //// grapql ////

  router.use('/gql', function(req, res, next){
    const logger = pino({
      prettyPrint: { colorize: true },
    })

    if(env !== 'production'){
      logger.debug(pick(req, ['path', 'query', 'body']))
    }

    const user = {}

    return graphql({
      schema,
      graphiql: env === 'development',
      context: new Context({ env, user }, {}),
      formatError(err){
        logger.error({ err })
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
