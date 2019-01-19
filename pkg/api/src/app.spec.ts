import { expect } from 'chai'
import * as lambda from 'aws-lambda'
import * as awsServerlessExpress from 'aws-serverless-express'
import { app } from './app'
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
    ...{
      ...merge,
      '//body': typeof merge.body === 'object' ? JSON.stringify(merge.body) : merge.body || '',
    },
  }
  root.headers = headers
  return root
}


const server = awsServerlessExpress.createServer(app)

const handler = (
  event: lambda.APIGatewayProxyEvent,
  context: lambda.Context,
): Promise<lambda.APIGatewayProxyResult> => (
  awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise
)

describe('lambda', () => {

  after(() => {console.log('close'); server.close()})

  it('should return users', async () => {
    const event = makeEvent({
      path: '/api/users',
    })

    const res = await handler(event, <lambda.Context>{})
    expect(res).to.have.property('statusCode', 200)
    expect(res).to.have.property('body')
    expect(res).to.have.property('headers')
  })
})
