import { readFileSync } from 'fs'
import * as path from 'path'
import * as ConstraintDirective from 'graphql-constraint-directive'
import { makeExecutableSchema } from 'graphql-tools'
import { userNotes } from './userNotes'


export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
  }
}

export const typeDefs = readFileSync(
  path.join(__dirname, './schema.gql'), 'utf8')

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    should: ConstraintDirective,
  },
})
