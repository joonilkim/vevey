import { Context } from '../Context'

export const schema = `
  type Query {
    ping: String!

    me: Me! @auth

    author(id: ID!): Author

    post(id: ID!): Post
  }
`

export const resolvers = {
  Query: {
    ping,
    me,
    post,
    author,
  }
}

function ping(){
  return 'ok'
}

function me(_, {}, { me, User }: Context) {
  return User.get(me, me.id)
}

function author(_, { id }, { me, User }: Context) {
  return User.get(me, id)
}

function post(_, { id }, { me, Post }: Context) {
  return Post.get(me, id)
}


