export const formatError = er => {
  er = er['originalError'] || er

  const location = er['location']
  const path = er['path']
  const code = er['code'] || 'InternalServerError'
  const statusCode = er['statusCode'] || 500
  const isInternal = !er['code'] && !er['statusCode']
  const message = isInternal ? "Sorry, there's something wrong" : er.message
  const extra = er.extra

  return {
    statusCode,
    code,
    message,
    location,
    path,
    extra,
  }
}
