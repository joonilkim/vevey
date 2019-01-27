export const BadRequest = createError('BadRequest')
export const Unauthorized = createError('Unauthorized')
export const Forbidden = createError('Forbidden')
export const NotFound = createError('NotFound')
export const MethodNotAllowed = createError('MethodNotAllowed')
export const NotAcceptable = createError('NotAcceptable')
export const RequestTimeout = createError('RequestTimeout')
export const Conflict = createError('Conflict')
export const Gone = createError('Gone')
export const InternalError = createError('InternalError', false)

export function wrapError(err: Error, type=InternalError, message?: string){
  const proto = type.prototype

  err.name = proto.name
  err['extra'] = { message: err.message }
  err.message = message || err.message
  err['code'] = proto.code
  err['isUserError'] = proto.isUserError
  return err
}

function createError(name: string, isUserError=true){
  function fn(message?: string, extra?: object){
    Error.captureStackTrace(this, this.constructor)
    Error.call(this, message)
    this.extra = { message }
  }

  fn.prototype = Object.create(Error.prototype)
  fn.prototype.constructor = fn
  fn.prototype.name = name
  fn.prototype.code = name
  fn.prototype.isUserError = true
  return fn
}


