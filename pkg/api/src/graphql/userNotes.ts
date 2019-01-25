import { Context } from '../Context'

export const userNotes = (
  _,
  { userId, limit, pos },
  { me, Note }: Context,
) =>
  Note.listByUser(me, userId, limit, pos)
