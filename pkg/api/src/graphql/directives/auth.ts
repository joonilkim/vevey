import * as assert from 'assert-err'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { Unauthorized } from '../errors'

class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, detail) {
    if (field._authWrapped) return
    field._authWrapped = true

    const { resolve = defaultFieldResolver } = field

    field.resolve = function(...args){
      const me = (args[2]['me'] || {})['id']
      assert(!!me, Unauthorized)

      return resolve.apply(this, args)
    }
  }

}

export const schema = `
directive @auth on FIELD_DEFINITION
`

export const directive = {
  auth: AuthDirective
}
