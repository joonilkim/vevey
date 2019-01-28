import * as assert from 'assert-err'
import { Context } from '../../Context'
import { Forbidden } from '../errors'

export const schema = `
  type Query {
    ping: String!

    userNotes(
      userId: ID!
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int! @constraint(min: 1, max: 30)
    ): [Note!]! @auth

    note(
      id: ID!
    ): Note @auth
  }
`

export const resolvers = {
  Query: {
    ping: () => 'ok',
    userNotes,
    note,
  }
}

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


