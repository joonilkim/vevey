import { expect } from 'chai'
import * as lambda from 'aws-lambda'
import * as awsServerlessExpress from 'aws-serverless-express'
import app from './app'
import * as eventTemplate from './eventTemplate.spec.json'

function makeEvent(
  merge: Partial<lambda.APIGatewayProxyEvent>
): lambda.APIGatewayProxyEvent {
  const clone = (json: {}) => JSON.parse(JSON.stringify(json))

  const baseEvent = clone(eventTemplate)
  const headers = {
    ...baseEvent.headers,
    ...merge.headers,
  }
  const root = {
    ...baseEvent,
    ...merge,
  }
  root.headers = headers
  return root
}

interface gqlResponse extends lambda.APIGatewayProxyResult {
  data: {
    [key: string]: any
  }
}

const gqlRequest = async function(
  query: string
): Promise<gqlResponse> {
  const event = makeEvent({
    path: '/api/gql/echo',
    body: JSON.stringify({
      query
    }),
  })

  const res = await handler(event)
  console.log(res.body)
  return {
    ...res,
    data: (JSON.parse(res.body) || {})['data'],
  }
}


const server = awsServerlessExpress.createServer(app)

const handler = (
  event: lambda.APIGatewayProxyEvent,
): Promise<lambda.APIGatewayProxyResult> => (
  awsServerlessExpress.proxy(
    server, event, <lambda.Context>{}, 'PROMISE'
  ).promise
)

describe('integraion', () => {

  after(() => {console.log('close'); server.close()})

  describe('rest', () => {

    it('should return users', async () => {
      const event = makeEvent({
        path: '/api/users',
      })

      const res = await handler(event)
      expect(res).to.have.property('statusCode', 200)
      expect(res).to.have.property('body')
      expect(res).to.have.property('headers')
    })

  })

  describe('graphql', () => {

    it('echo request', async () => {
      const msg = 'hello'
      const query = `{ echo(message: "${msg}") }`

      const res = await gqlRequest(query)

      expect(res).to.have.property('statusCode', 200)
      expect(res.data.user).to.have.property('body', 200)
    })

  })
})
