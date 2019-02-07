import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema, wrapError } from './graphql'
import * as User from './models/User'
import * as Token from './models/Token'
import { Context } from './Context'

const { auth, graphqlHttp, logger } = gql.express


export function router() {
  const env = process.env.NODE_ENV || 'development'
  const secret = process.env.TOKEN_SECRET || 'mytokensecret'
  const saltRound = Number(process.env.SALT_ROUND || '8')

  const router = express.Router()

  const models = {
    User: User.createModel({ saltRound }),
    Token: Token.createModel({ secret })
  }

  router.use(logger({ env }))

  router.use(auth({ secret }))

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    ...models,
  })

  router.use('/auth', graphqlHttp({
    schema,
    graphiql: env === 'development',
    createContext,
    wrapError,
  }))

  return router
}
