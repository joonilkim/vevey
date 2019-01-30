import { expect } from 'chai'
import { CloudFrontResponseEvent } from 'aws-lambda'
import { handler, securityHeaders } from '../src/secure'
import * as data from './cloudfront-response.json'

// @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html

const clone = (o: {}) => JSON.parse(JSON.stringify(o))

describe('handler', () => {
  it('should response with security headers', async () => {
    const event = clone(data) as CloudFrontResponseEvent

    const resp = await handler(event)
    expect(resp).to.have.property('headers')

    Object.keys(securityHeaders).forEach(key => (
      expect(resp.headers[key.toLowerCase()][0]).to.have.property('key', key)
    ))
  })
})
