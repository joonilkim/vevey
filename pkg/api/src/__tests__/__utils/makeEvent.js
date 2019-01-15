const apiGatewayEvent = require('./api-gateway-event.json')

const clone = json => JSON.parse(JSON.stringify(json))

function makeEvent(merge) {
  const baseEvent = clone(apiGatewayEvent)
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

module.exports = makeEvent
