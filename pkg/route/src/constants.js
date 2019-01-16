exports.securityHeaders = {
  // Client should never sniff MIME type of files
  'X-Content-Type-Options': 'nosniff',

  // No rendering if the origin doesn’t match in iframe
  'X-Frame-Options': 'DENY',

  // If an XSS attack is detected, the browser will sanitize the page to stop the attack.
  'X-XSS-Protection': '1; mode=block',
}
