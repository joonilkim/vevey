import * as auth from './auth'
import * as constraint from './constraint'

export const schema = [
  auth.schema,
  constraint.schema,
].join('\n')

export const schemaDirectives = {
  ...auth.directive,
  ...constraint.directive,
}
