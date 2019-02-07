import * as assert from 'assert-err'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { Unauthorized, isEmpty } from '@vevey/common'

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, detail) {
    if (field._authWrapped) return
    field._authWrapped = true

    const { resolve = defaultFieldResolver } = field
    const role = this.args['role']

    field.resolve = function(...args){
      const me = (args[2]['me'] || {})['id']
      if(role === 'User') {
        assert(!isEmpty(me), Unauthorized)
      }
      if(role === 'Guest') {
        assert(isEmpty(me), Unauthorized)
      }

      return resolve.apply(this, args)
    }
  }

}

export const schema = `
  enum AuthRole {
    Any
    User
    Guest
  }

  directive @auth(
    role: AuthRole = User
  ) on FIELD_DEFINITION
`

export const directive = {
  auth: AuthDirective
}
