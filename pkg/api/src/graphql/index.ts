import * as ConstraintDirective from 'graphql-constraint-directive'
import { makeExecutableSchema } from 'graphql-tools'
import { userNotes, createNote } from './notes'
import { schema as typeDefs } from './schema.gql'
import * as scalar from './scalar'


export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
  },
  Mutation: {
    createNote,
  },
  ...scalar,
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    should: ConstraintDirective,
  },
})
