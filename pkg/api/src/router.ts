import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
import * as Post from './models/Post'
import * as User from './models/User'
import { Context } from './Context'

const { auth, graphqlHttp, logger } = gql.express


export function router() {
  const env = process.env.NODE_ENV || 'development'
  const secret = process.env.TOKEN_SECRET || 'mytokensecret'

  const router = express.Router()

  const models = {
    Post: Post.init(),
    User: User.init(),
  }

  router.use(logger({ env }))

  router.use(auth({ secret }))

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    Post: models.Post(),
    User: models.User(),
  })

  router.use('/app', graphqlHttp({
    schema,
    graphiql: env === 'development',
    createContext,
  }))

  return router
}
