import {
    CloudFrontResponse,
    CloudFrontResponseEvent,
} from 'aws-lambda'

const securityHeaders: {[key: string]: string} = {
  // Client should never sniff MIME type of files
  'X-Content-Type-Options': 'nosniff',

  // No rendering if the origin doesn’t match in iframe
  'X-Frame-Options': 'DENY',

  // If an XSS attack is detected, the browser will sanitize the page
  // to stop the attack.
  'X-XSS-Protection': '1; mode=block',
}

async function handler(
    event: CloudFrontResponseEvent,
): Promise<CloudFrontResponse> {
  const resp = event.Records[0].cf.response

  Object.keys(securityHeaders).forEach(key => (
    resp.headers[key.toLowerCase()] = [{
      key,
      value: securityHeaders[key],
    }]
  ))
  return resp
}

export {
  securityHeaders,
  handler,
}
