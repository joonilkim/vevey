import * as gql from 'graphql'

export const ping: gql.GraphQLFieldConfig<{}, {}> = {
  type: gql.GraphQLNonNull(gql.GraphQLString),
  resolve(){
    return 'ok'
  }
}
