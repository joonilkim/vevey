function createError(name: string){
  function fn(err?, message?, extra?){
    if(err && !(err instanceof Error))
      [err, message, extra] = [null, err, message]

    if(!err) {
      err = new Error(message || name)
      // capture a stack trace to the construction point
      Error.captureStackTrace(err, this.constructor)
    }

    err.name = name
    err.extra = { message: err.message }
    err.message = name
    err.code = name
    err.isUserError = true

    return err
  }

  fn.prototype = Object.create(Error.prototype)
  fn.prototype.constructor = fn
  return fn
}

export const BadRequest = createError('BadRequest')
export const Unauthorized = createError('Unauthorized')
export const Forbidden = createError('Forbidden')
export const NotFound = createError('NotFound')
export const MethodNotAllowed = createError('MethodNotAllowed')
export const NotAcceptable = createError('NotAcceptable')
export const RequestTimeout = createError('RequestTimeout')
export const Conflict = createError('Conflict')
export const Gone = createError('Gone')
