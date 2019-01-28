import { makeExecutableSchema } from 'graphql-tools'
import * as directives from './directives'
import * as types from './types'

export { formatError } from './formatError'


export const typeDefs = [
  directives.schema,
  types.schema,
].join('\n')

export const resolvers = types.resolvers

export const schemaDirectives = directives.schemaDirectives

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
})
