import { isNumber } from 'underscore'
import { Context } from '../Context'

export const schema = `
  type Author {
    id: ID!

    name: String!

    posts(
      loc: Integer
      limit: Int! @constraint(min: 1, max: 30)
    ): PostList!
  }
`

export const resolvers = {
  Author: {
    posts,
  }
}

function posts(
    author: { id }, { limit, loc }, { me, Post }: Context) {
  loc = isNumber(loc) ? loc : Number.MAX_SAFE_INTEGER
  return Post.all(me, author.id, { limit, loc })
}
