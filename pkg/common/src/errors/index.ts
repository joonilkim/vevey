export const InvalidInput = createError(
  'InvalidInput', 400, 'One of the request inputs is not valid.')
export const MissingParameter = createError(
  'MissingParameter', 400, 'A required input parameter was not specified for this request.')
export const OutOfRangeInput = createError(
  'OutOfRangeInput', 400, 'One of the request inputs is out of range.')
export const InvalidGraphqlSyntax = createError(
  'InvalidGraphqlSyntax', 400, `Sorry, there's something worng.`)
export const Unauthorized = createError(
  'Unauthorized', 401, 'Server failed to authenticate the request. Make sure the value of the Authorization header.')
export const UserDisabled = createError(
  'UserDisabled', 403, 'The specified user is disabled.')
export const NoPermission = createError(
  'NoPermission', 403, 'The user being accessed does not have sufficient permissions ')
export const ResourceNotFound = createError(
  'ResourceNotFound', 404, 'The specified resource does not exist.')
export const UserExists = createError(
  'UserExists', 409, 'The specified user already exists.')
export const ResourceExists = createError(
  'ResourceExists', 409, 'The specified resource already exists.')
export const InternalError = createError(
  'InternalError', 500, `Sorry, there's something worng. Please retry the request`)
export const Timedout= createError(
  'Timedout', 500, `The operation could not be completed within the permitted time.`)

export class ErrorType {
  name: string
  message: string
  code: string
  statusCode: number
  location?: any
  path?: any
  extra?: any

  constructor(message?: string, extra?: object){}
}

export function wrapError(
  err: Error, type=InternalError, message?: string
): ErrorType {
  const proto = type.prototype

  err['extra'] = { message: err.message }
  err.message = message || proto.message
  err['code'] = proto.code
  err['statusCode'] = proto.statusCode
  return <ErrorType>err
}

function createError(
  name: string, statusCode: number, defaultMessage: string
): typeof ErrorType {
  function fn(message?: string, extra?: object){
    Error.captureStackTrace(this, this.constructor)
    Error.call(this, message || name)
    if(message){ this.extra = { message } }
    this.message = message || defaultMessage
  }

  fn.prototype = Object.create(Error.prototype)
  fn.prototype.constructor = fn
  fn.prototype.name = name
  fn.prototype.code = name
  fn.prototype.statusCode = statusCode
  fn.prototype.message = defaultMessage
  return <any>fn
}


