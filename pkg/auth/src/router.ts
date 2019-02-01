import * as AWS from 'aws-sdk'
import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
import { User } from './models/User'
import { Context } from './Context'
import { createCognito } from './connectors/Cognito'

const { auth, graphqlHttp, logger } = gql.express


export default function() {
  const env = process.env.NODE_ENV || 'development'

  AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
  })

  const cognito = createCognito()

  const models = {
    User: new User(cognito),
  }

  const router = express.Router()

  router.use(logger({ env }))

  router.use(auth())

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    ...models,
  })

  router.use('/gql', graphqlHttp({
    schema,
    graphiql: env === 'development',
    createContext,
  }))

  //// rest api ////

  router.get('/users', (_, res) => {
    res.json([
      {id: 1, name: 'Joe'},
    ])
  })

  return router
}
