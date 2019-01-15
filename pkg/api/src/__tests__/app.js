const awsServerlessExpress = require('aws-serverless-express')
const app = require('../app')
const makeEvent = require('./__utils/makeEvent')

const server = awsServerlessExpress.createServer(app)

const handler = event => (
  awsServerlessExpress.proxy(server, event, {}, 'PROMISE').promise
)

afterAll(() => server.close())

describe('lambda', () => {
  it('should return users', async () => {
    const event = makeEvent({
      path: '/users',
    })

    const res = await handler(event, {})
    expect(res).toHaveProperty('statusCode', 200)
    expect(res).toHaveProperty('body')
    expect(res).toHaveProperty('headers')
  })
})
