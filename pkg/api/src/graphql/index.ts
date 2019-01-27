import * as ConstraintDirective from 'graphql-constraint-directive'
import { makeExecutableSchema } from 'graphql-tools'
import * as Query from './Query'
import * as Mutation from './Mutation'
import * as Scalar from './Scalar'
import * as Note from './Note'

export { formatError } from './formatError'


export const typeDefs = [
  Scalar.schema,
  Query.schema,
  Mutation.schema,
  Note.schema,
].join('\n')

export const resolvers = {
  ...Scalar.resolvers,
  ...Query.resolvers,
  ...Mutation.resolvers,
  ...Note.resolvers,
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    should: ConstraintDirective,
  },
})
