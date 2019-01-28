import * as assert from 'assert-err'
import {
  GraphQLNonNull,
  GraphQLScalarType,
} from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import { ValidationError } from '../errors'

class ConstraintDirective extends SchemaDirectiveVisitor {
  visitArgumentDefinition(field){
    this.wrapField(field)
  }

  visitInputFieldDefinition(field) {
    this.wrapField(field)
  }

  wrapField(field){
    const fieldName = field.astNode.name.value

    if (field.type instanceof GraphQLNonNull &&
        field.type.ofType instanceof GraphQLScalarType) {

      field.type = new GraphQLNonNull(
        new ConstraintType(fieldName, field.type.ofType, this.args))

    } else if (field.type instanceof GraphQLScalarType) {

      field.type = new ConstraintType(fieldName, field.type, this.args)
    } else {
      throw new ValidationError(
        `${fieldName} is not a scalar type: ${field.type}`)
    }
  }
}

class ConstraintType extends GraphQLScalarType {
  constructor (fieldName, type, args) {
    const validate = value =>
      Object.keys(validators)
        .filter(name => !!args[name])
        .forEach(name => validators[name](fieldName, args[name], value))

    super({
      name: `ConstraintType`,
      serialize (value) {
        return type.serialize(value)
      },
      parseValue (value) {
        value = type.parseValue(value)

        validate(value)

        return value
      },
      parseLiteral (ast) {
        const value = type.parseLiteral(ast)

        validate(value)

        return value
      }
    })
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
) on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
`

export const directive = {
  constraint: ConstraintDirective
}
