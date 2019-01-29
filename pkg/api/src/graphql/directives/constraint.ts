import * as assert from 'assert-err'
import { defaultFieldResolver, } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { ValidationError } from '../errors'

class ConstraintDirective extends SchemaDirectiveVisitor {
  visitArgumentDefinition(arg, { field }){
    if (field._constraintWrapped) return
    field._constraintWrapped = true
    this.wrapField(arg, field)
  }

  wrapField(arg, field){
    const argName = arg.astNode.name.value

    const { resolve = defaultFieldResolver } = field
    const directiveArgs = this.args

    field.resolve = function(...args){
      const value = args[1][argName]
      Object.keys(validators)
        .filter(name => !!directiveArgs[name])
        .forEach(name =>
          validators[name](argName, directiveArgs[name], value))

      return resolve.apply(this, args)
    }

  }
}


const validators = {
  min(fieldName, arg, val){
    assert(
      typeof val === 'number' && val >= arg,
      ValidationError,
      `${fieldName} must be at least ${arg}`)
  },

  max(fieldName, arg, val){
    assert(
      typeof val === 'number' && val <= arg,
      ValidationError,
      `${fieldName} must be no greater than ${arg}`)
  },

  minLength(fieldName, arg, val){
    assert(
      typeof val === 'string' && val.length >= arg,
      ValidationError,
      `${fieldName} must be at least ${arg} characters`)
  },

  maxLength(fieldName, arg, val){
    assert(
      typeof val === 'string' && val.length <= arg,
      ValidationError,
      `${fieldName} must be no greater than ${arg} characters`)
  },

  pattern(fieldName, arg, val){
    assert(
      typeof val === 'string' && new RegExp(arg).test(val),
      ValidationError,
      `${fieldName} must match ${arg}`)
  },

}

export const schema = `
directive @constraint(
  min: Int
  max: Int
  minLength: Int
  maxLength: Int
  pattern: String
) on ARGUMENT_DEFINITION
`

export const directive = {
  constraint: ConstraintDirective
}
