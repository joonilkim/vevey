import * as ConstraintDirective from 'graphql-constraint-directive'
import { makeExecutableSchema } from 'graphql-tools'
import { userNotes } from './userNotes'
import { schema as typeDefs } from './schema.gql'


export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
  }
}

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    should: ConstraintDirective,
  },
})
