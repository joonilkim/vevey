import { Forbidden } from 'http-errors'
import * as assert from 'assert-err'
import { Context } from '../Context'
import { createUUID } from '../utils'

export function userNotes(
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


export function createNote(
  _,
  { contents },
  { me, Note }: Context,
) {
  assert(!!me.id, Forbidden)

  return Note.create({
    id: createUUID(),
    userId: me.id,
    contents,
    pos: new Date().getTime(),
  })
}
