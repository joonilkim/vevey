import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as awsServerlessExpressMiddleware from 'aws-serverless-express/middleware'

const app = express()
const router = express.Router()

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())

router.get('/users', (_, res) => {
  res.json(users)
})

router.get('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId)

  if (!user) return res.status(404).json({})

  return res.json(user)
})

router.post('/users', (req, res) => {
  const user = {
    id: ++userIdCounter,
    name: req.body.name,
  }
  users.push(user)
  res.status(201).json(user)
})

router.put('/users/:userId', (req, res) => {
  const user = getUser(req.params.userId)

  if (!user) return res.status(404).json({})

  user.name = req.body.name
  res.json(user)
})

router.delete('/users/:userId', (req, res) => {
  const userIndex = getUserIndex(req.params.userId)

  if (userIndex === -1) return res.status(404).json({})

  users.splice(userIndex, 1)
  res.json(users)
})

const getUser = ((userId: number | string) =>
  users.find(u => u.id === parseInt(<string>userId))
)
const getUserIndex = ((userId: number | string) =>
  users.findIndex(u => u.id === parseInt(<string>userId))
)

// Ephemeral in-memory data store
const users = [{
  id: 1,
  name: 'Joe',
}, {
  id: 2,
  name: 'Jane',
}]
let userIdCounter = users.length

app.use('/api', router)

export {
  app
}
