import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as serverless from 'aws-serverless-express/middleware'
import * as graphql from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'

const app = express()
app.disable('x-powered-by')

const router = express.Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
// get event object by `req.apiGateway.event`
router.use(serverless.eventContext())

const typeDefs = `
  type Query {
    echo(msg: String!): String
  }
`

const resolvers = {
  Query: {
    // @see: https://www.apollographql.com/docs/graphql-tools/resolvers.html
    echo: (_, { msg }) => msg
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

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
