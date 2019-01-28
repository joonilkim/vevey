import * as assert from 'assert-err'
import { Context } from '../../Context'
import { Forbidden } from '../errors'

function userNotes(
  _,
  { userId, limit, pos },
  { me, Note }: Context,
) {
  assert(me.id === userId, Forbidden)

  return Note
    .query('userId').eq(userId)
    .where('pos').lt(pos)
    .filter('contents').not().null()
    .limit(limit)
    .descending()
    .exec()
}

function note(
  _,
  { id },
  { me, Note }: Context,
) {
  const filterDeleted = note =>
    note && note.contents ? note : null

  const requirePermission = note => {
    if(note)
      assert(me.id === note.userId, Forbidden)
    return note
  }

  return Note
    .get({ id })
    .then(filterDeleted)
    .then(requirePermission)
}

export const schema = `
  type Query {
    ping: String!

    userNotes(
      userId: ID! @auth(me: true)
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int!
    ): [Note!]!

    note(
      id: ID! @auth
    ): Note
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
    note,
  }
}
