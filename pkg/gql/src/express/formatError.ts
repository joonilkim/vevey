export const formatError = er => {
  const isUserError = er['isUserError']

  const location = er['location']
  const path = er['path']
  const code = isUserError ? er['code'] || 'BadRequest' : 'InternalServerError'
  const message = isUserError ? er.message : 'Internal Server Error'
  const extra = er.extra

  return {
    code,
    message,
    location,
    path,
    extra,
  }
}
