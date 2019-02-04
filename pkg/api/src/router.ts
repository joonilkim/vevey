import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
import * as Note from './models/Note'
import { Context } from './Context'

const { auth, graphqlHttp, logger } = gql.express


export function router() {
  const env = process.env.NODE_ENV || 'development'
  const secret = process.env.TOKEN_SECRET || 'mytokensecret'

  const router = express.Router()

  const models = {
    Note: Note.createModel(),
  }

  router.use(logger({ env }))

  router.use(auth({ secret }))

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

  return router
}
