import {
  shouldBeOwner,
} from './permissions'

export function userNotes(
  _,
  { userId, limit, pos },
  { me, Note },
) {
  shouldBeOwner(me['id'], userId)

  return Note
    .query('userId')
    .eq(userId)
    .where('pos')
    .lt(pos)
    .limit(limit)
    .descending()
    .exec()
}
