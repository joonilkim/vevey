import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql'
import { ping } from './ping'
import { notes } from './notes'

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    ping,
    notes,
  }
})

export default new GraphQLSchema({
  query,
})
