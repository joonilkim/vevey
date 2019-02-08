import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
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
    User: User.init({ saltRound }),
    Token: Token.init({ secret })
  }

  router.use(logger({ env }))

  router.use(auth({ secret }))

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    User: models.User(),
    Token: models.Token(),
  })

  router.use('/auth', graphqlHttp({
    schema,
    graphiql: env === 'development',
    createContext,
  }))

  return router
}
