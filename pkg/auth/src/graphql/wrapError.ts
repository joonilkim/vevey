import { ValidationError } from '@vevey/common'
import * as common from '@vevey/common'

const wrapErr = common.wrapError

export function wrapError(er){
  if (er.name === 'ValidationError') {
    return wrapErr(er, ValidationError)
  }
  return er
}
