import * as Query from './Query'
import * as Mutation from './Mutation'
import * as Scalar from './Scalar'
import * as Note from './Note'

export const schema = [
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
