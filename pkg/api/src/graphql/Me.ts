import { isNumber } from 'underscore'
import { Context } from '../Context'

export const schema = `
  type Me {
    id: ID!

    email: String!

    name: String!

    posts(
      loc: Integer
      limit: Int! @constraint(min: 1, max: 30)
    ): PostList! @auth
  }
`

export const resolvers = {
  Me: {
    posts,
  }
}

function posts(_, { limit, loc }, { me, Post }: Context) {
  loc = isNumber(loc) ? loc : Number.MAX_SAFE_INTEGER
  return Post.all(me, me.id, { limit, loc })
}
