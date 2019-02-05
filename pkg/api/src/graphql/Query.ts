import { Context } from '../Context'

export const schema = `
  type Query {
    ping: String!

    postsByAuthor(
      authorId: ID!
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int! @constraint(min: 1, max: 30)
    ): PostPagination! @auth

    getPost(
      id: ID!
    ): Post @auth
  }

  type PostPagination {
    items: [Post!]!
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
    postsByAuthor,
    getPost,
  }
}

function postsByAuthor(
  _, { authorId, limit, pos }, { me, Post }: Context
) {
  return Post.allByAuthor(me, authorId, { limit, pos })
}

function getPost(
  _, { id }, { me, Post }: Context
) {
  return Post.get(me, id)
}
