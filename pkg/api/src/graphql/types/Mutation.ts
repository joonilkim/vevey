import { pickBy, identity } from 'lodash'
import { createUUID } from '../../utils'
import { Context } from '../../Context'
import { Forbidden, wrapError } from '../errors'

function createNote(
  _,
  { contents },
  { me, Note }: Context,
) {
  return Note.create({
    id: createUUID(),
    userId: me.id,
    contents,
    pos: new Date().getTime(),
  })
}

function updateNote(
  _,
  { id, contents, pos },
  { me, Note }: Context,
) {
  const key = { id }
  const toUpdate = pickBy({ contents, pos }, identity)
  const condition = {
    condition: 'userId = :userId',
    conditionValues: { userId: me.id },
  }

  const requirePermission = er => {
    if(er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  // @ts-ignore
  return Note.update(key, toUpdate, condition)
    .catch(requirePermission)
}

function deleteNote(
  _,
  { id },
  { me, Note }: Context,
) {
  const key = { id }
  const toDelete = { contents: null, pos: null }
  const condition = {
    condition: 'userId = :userId',
    conditionValues: { userId: me.id },
  }

  const requirePermission = er => {
    if(er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  // @ts-ignore
  return Note.update(key, { $DELETE: toDelete }, condition)
    .then(() => null)
    .catch(requirePermission)
}

export const schema = `
  type Mutation {

    createNote(
      contents: String! @auth
    ): Note

    updateNote(
      id: ID! @auth
      contents: String!
      pos: Integer
    ): Note

    deleteNote(
      id: ID! @auth
    ): Boolean
  }
`

export const resolvers = {
  Mutation: {
    createNote,
    updateNote,
    deleteNote,
  }
}
