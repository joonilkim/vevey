const cloudfrontResponse = require('./cloudfront-response.json')
const { handler } = require('../withSecurity')
const { securityHeaders } = require('../constants')

// @see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html

const clone = o => JSON.parse(JSON.stringify(o))

describe('handler', () => {
  it('should response with security headers', async () => {
    const event = clone(cloudfrontResponse)
    expect(event.Records[0].cf.response).not.toBeNull()

    const resp = await handler(event, {})
    expect(resp).toHaveProperty('headers')

    Object.keys(securityHeaders).forEach(key => (
      expect(resp.headers[key.toLowerCase()][0]).toHaveProperty('key', key)
    ))
  })
})
