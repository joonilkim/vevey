import * as assert from 'assert-err'
import { defaultFieldResolver, } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { ValidationError } from '@vevey/common'

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

export const schema = `
  enum ConstraintFormat {
    email
    password
  }

  directive @constraint(
    min: Int
    max: Int
    minLength: Int
    maxLength: Int
    pattern: String
    format: ConstraintFormat
  ) on ARGUMENT_DEFINITION
`

export const directive = {
  constraint: ConstraintDirective
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
      `${fieldName} has invalid format`)
  },

  format(fieldName, arg, val){
    assert(typeof val === 'string', ValidationError)
    if(arg === 'email') { return validateEmail(val) }
    if(arg === 'password') { return validatePassword(val) }
  },
}

function validatePassword(pwd){
  if(!/^[a-zA-Z0-9!@#$%^&*()_+}{":;'?/>.<,]{8,}$/.test(pwd))
    throw new ValidationError(
      'Password must have at least 8 characters.')

  if(!/[a-z]+/.test(pwd))
    throw new ValidationError(
      'Password must have at least one lowercase letter.')

  if(!/[A-Z]+/.test(pwd))
    throw new ValidationError(
      'Password must have at least one uppercase letter.')

  if(!/[0-9!@#$%^&*()_+}{":;'?/>.<,]+/.test(pwd))
    throw new ValidationError(
      'Password must have at least one digit or non letter.')
}

function validateEmail(email){
  if(!/^\S+@\S+\.\S+$/.test(email))
    throw new ValidationError('Invalid email format.')
}

