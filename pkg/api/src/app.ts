import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as serverless from 'aws-serverless-express/middleware'
import * as graphql from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'

const app = express()
const router = express.Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(serverless.eventContext())

const typeDefs = `
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello World'
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
