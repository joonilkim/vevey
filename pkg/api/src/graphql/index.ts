import { makeExecutableSchema } from 'graphql-tools'
import { gtypes } from '@vevey/gql'
import * as Query from './Query'
import * as Mutation from './Mutation'
import * as Post from './Post'

export const typeDefs = [
  gtypes.auth.schema,
  gtypes.constraint.schema,
  gtypes.Date.schema,
  gtypes.Integer.schema,
  Query.schema,
  Mutation.schema,
  Post.schema,
].join('\n')

export const resolvers = {
  ...gtypes.Date.resolvers,
  ...gtypes.Integer.resolvers,
  ...Query.resolvers,
  ...Mutation.resolvers,
  ...Post.resolvers,
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
