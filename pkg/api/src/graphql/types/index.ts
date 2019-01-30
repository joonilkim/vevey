import * as Query from './Query'
import * as Mutation from './Mutation'
import * as Note from './Note'

export const schema = [
  Query.schema,
  Mutation.schema,
  Note.schema,
].join('\n')

export const resolvers = {
  ...Query.resolvers,
  ...Mutation.resolvers,
  ...Note.resolvers,
}
