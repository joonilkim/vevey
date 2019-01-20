import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql'
import ping from './ping'

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    ping,
  }
})

export default new GraphQLSchema({
  query,
})
