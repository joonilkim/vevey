import * as auth from './auth'

export const schema = [
  auth.schema,
].join('\n')

export const schemaDirectives = {
  ...auth.directive,
}
