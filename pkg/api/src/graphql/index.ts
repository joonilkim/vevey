import { makeExecutableSchema } from 'graphql-tools'
import { gtypes } from '@vevey/gql'
import * as types from './types'


export const typeDefs = [
  gtypes.auth.schema,
  gtypes.constraint.schema,
  gtypes.Date.schema,
  gtypes.Integer.schema,
  types.schema,
].join('\n')

export const resolvers = {
  ...gtypes.Date.resolvers,
  ...gtypes.Integer.resolvers,
  ...types.resolvers,
}

export const schemaDirectives = {
  ...gtypes.auth.directive,
  ...gtypes.constraint.directive,
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
})
