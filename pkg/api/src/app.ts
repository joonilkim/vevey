import * as serverless from 'aws-serverless-express/middleware'
import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as graphql from 'express-graphql'
import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql'
import * as pinoLogger from 'pino-http'

import schema from './schema'

const app = express()
app.disable('x-powered-by')
app.use(pinoLogger({
  prettyPrint: { colorize: true }
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// get event object by `req.apiGateway.event`
app.use(serverless.eventContext())

const router = express.Router()

router.use('/gql', graphql({
  schema,
  graphiql: process.env.NODE_ENV !== 'development',
}))

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

app.use('/api', router)

export default app
