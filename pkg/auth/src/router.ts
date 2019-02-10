import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
import { mailgun } from './connectors/mailgun'
import * as User from './models/User'
import * as Token from './models/Token'
import * as Mailer from './models/Mailer'
import { Context } from './Context'

const { auth, graphqlHttp, logger } = gql.express


export function router() {
  const env = process.env.NODE_ENV || 'development'
  const secret = process.env.TOKEN_SECRET || 'mytokensecret'
  const saltRound = Number(process.env.SALT_ROUND || '8')

  const router = express.Router()

  const models = {
    User: User.init({ saltRound }),
    Token: Token.init({ secret }),
    Mailer: Mailer.init({
      connector: {
        sendmail: mailgun(),
      }
    }),
  }

  router.use(logger({ env }))

  router.use(auth({ secret }))

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    User: models.User(),
    Token: models.Token(),
    Mailer: models.Mailer,
  })

  router.use('/auth', graphqlHttp({
    schema,
    graphiql: env === 'development',
    createContext,
  }))

  return router
}
