import { Forbidden } from './errors'
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

function note(
  _,
  { id },
  { me, Note }: Context,
) {
  assert(!!me.id, Forbidden)

  /*
  const handleNotFound = er => {
    if(er.code === 'ResourceNotFoundException')
      throw wrapError(er, Forbidden)
    throw er
  }
  */

  const handlePermission = note => {
    if(note)
      assert(me.id === note.userId, Forbidden)
    return note
  }

  return Note
    .get({ id })
    .then(handlePermission)
}

export const schema = `
  type Query {
    ping: String!

    userNotes(
      userId: ID!
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int!
    ): [Note!]!

    note(
      id: ID!
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
