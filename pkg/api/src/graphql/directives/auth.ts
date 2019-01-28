import * as assert from 'assert-err'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { Unauthorized, Forbidden } from '../errors'

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, detail) {
    if (field._authWrapped) return
    field._authWrapped = true

    const userField = this.args.me
    const { resolve = defaultFieldResolver } = field

    field.resolve = function(...args){
      const me = args[2]['me']
      const requireAuth = val => {
        assert(!!me, Unauthorized)
        return val
      }

      const requirePerm = val => {
        if(field.name === userField)
          assert(val === me['id'], Forbidden)
        return val
      }

      return Promise.resolve(resolve.apply(this, args))
        .then(requireAuth)
        .then(requirePerm)
    }
  }

}

export const schema = `
directive @auth(
  me: Boolean = false
) on FIELD_DEFINITION
`

export const directive = {
  auth: AuthDirective
}
