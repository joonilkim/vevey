import * as gql from 'graphql'
import { Context } from '../Context'

export const Note = new gql.GraphQLObjectType({
  name: 'Note',
  fields: {
    id: { type: gql.GraphQLID },
    user_id: { type: gql.GraphQLID },
    pos: { type: gql.GraphQLInt },
  }
})

export const notes: gql.GraphQLFieldConfig<{}, Context> = {
  type: gql.GraphQLNonNull(gql.GraphQLList(Note)),
  resolve({}, {}, context){
    return context.Notes.list()
  }
}
