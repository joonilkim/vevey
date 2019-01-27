export const formatError = graphqlError => {
  let er = graphqlError['originalError'] || graphqlError

  const location = er['location']
  const path = er['path']
  const code = er['code'] || 'InternalServerError'
  const message = er['isUserError'] ? er.message : 'Internal Server Error'
  const extra = er.extra

  return {
    code,
    message,
    location,
    path,
    extra,
  }
}
