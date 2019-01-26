import { Forbidden } from 'http-errors'
import * as assert from 'assert-err'
import { Context } from '../Context'

function userNotes(
  _,
  { userId, limit, pos },
  { me, Note }: Context,
) {
  assert(me.id === userId, Forbidden)

  return Note
    .query('userId')
    .eq(userId)
    .where('pos')
    .lt(pos)
    .limit(limit)
    .descending()
    .exec()
}

export const schema = `
  type Query {
    ping: String!
    userNotes(
      userId: ID!
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int!
    ): [Note!]!
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
  }
}
