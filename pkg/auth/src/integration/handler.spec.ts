import { expect } from 'chai'
import { Context } from 'aws-lambda'
import { server, handler } from '../index'
import * as baseEvent from './apigateway-event.spec.json'

const clone = obj => JSON.parse(JSON.stringify(obj))

const makeEvent = merge => ({
  ...clone(baseEvent),
  ...merge
})

describe('handler', () => {

  after(() => server.close())

  describe('should respond ping', () => {
    it('should be called', async () => {
      const event = makeEvent({
        path: '/api/gql',
        body: JSON.stringify({
          query: '{ ping }'
        }),
      })

      const res = await handler(event, <Context>{})
      expect(res).to.have.property('statusCode', 200)

      const data = JSON.parse(res.body)
      expect(data.data).to.have.property('ping', 'ok')
    })
  })

})
