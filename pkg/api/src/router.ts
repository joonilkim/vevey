import * as express from 'express'
import * as gql from '@vevey/gql'
import { schema } from './graphql'
import { Note } from './models/Note'
import { Context } from './Context'

const { auth, graphqlHttp, logger } = gql.express


export function router() {
  const env = process.env.NODE_ENV || 'development'
  const secret = process.env.TOKEN_SECRET || 'mytokensecret'

  const router = express.Router()

  router.use(logger({ env }))

  router.use(auth({ secret }))

  //// grapql ////

  const createContext = (req): Context => ({
    me: req['user'],
    Note,
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
