import * as assert from 'assert-err'
import { Forbidden } from '@vevey/common'
import { Context } from '../Context'

export const schema = `
  type Query {
    ping: String!

    userNotes(
      userId: ID!
      pos: Integer = ${Number.MAX_SAFE_INTEGER}
      limit: Int! @constraint(min: 1, max: 30)
    ): NotePagination! @auth

    note(
      id: ID!
    ): Note @auth
  }

  type NotePagination {
    items: [Note!]!
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
    .then(pagination)

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

const pagination = (items: []) => ({ items })
