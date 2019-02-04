import {
  ValidationError,
  Unauthorized,
} from '@vevey/common'
import * as common from '@vevey/common'

const wrapErr = common.wrapError

export function wrapError(er){
  if (er.name === 'ValidationError') {
    return wrapErr(er, ValidationError)
  }

  if(er.name === 'TokenExpiredError' ||
      er.name === 'JsonWebTokenError') {
    return wrapErr(er, Unauthorized)
  }
  return er
}
