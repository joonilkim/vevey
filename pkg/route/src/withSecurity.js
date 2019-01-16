const assert = require('assert')
const { securityHeaders } = require('./constants')

exports.handler = async (event, context) => {
  const resp = event.Records[0].cf.response
  assert(!!resp, `Invalid response: ${JSON.stringify(event)}`)

  Object.keys(securityHeaders).forEach(key => (
    resp.headers[key.toLowerCase()] = [{
      key,
      value: securityHeaders[key]
    }]
  ))
  return resp
}
