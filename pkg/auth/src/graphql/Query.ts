import { Context } from '../Context'

export const schema = `
  type Query {
    ping: String!

    getMe: Me! @auth
  }

  type Me {
    id: ID!
    email: String!
    name: String!
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
    getMe,
  }
}

function getMe(_, {}, { me, User, Token }: Context) {
  return User.get(me.id)
}
