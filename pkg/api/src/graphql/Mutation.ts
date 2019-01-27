import { Forbidden, wrapError } from './errors'
import * as assert from 'assert-err'
import { pickBy, identity } from 'lodash'
import { Context } from '../Context'
import { createUUID } from '../utils'

function createNote(
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

function updateNote(
  _,
  { id, contents, pos },
  { me, Note }: Context,
) {
  assert(!!me.id, Forbidden)

  const key = { id }
  const toUpdate = pickBy({ contents, pos }, identity)
  const condition = {
    condition: 'userId = :userId',
    conditionValues: { userId: me.id },
  }

  const handlePermission = er => {
    if(er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  // @ts-ignore
  return Note.update(key, toUpdate, condition)
    .catch(handlePermission)
}

function deleteNote(
  _,
  { id },
  { me, Note }: Context,
) {
  assert(!!me.id, Forbidden)

  const key = { id }
  const toDelete = { contents: null, pos: null }
  const condition = {
    condition: 'userId = :userId',
    conditionValues: { userId: me.id },
  }

  const handlePermission = er => {
    if(er.code === 'ConditionalCheckFailedException')
      throw wrapError(er, Forbidden)
    throw er
  }

  // @ts-ignore
  return Note.update(key, { $DELETE: toDelete }, condition)
    .then(() => null)
    .catch(handlePermission)
}

export const schema = `
  type Mutation {
    createNote(
      contents: String!
    ): Note

    updateNote(
      id: ID!
      contents: String!
      pos: Integer
    ): Note

    deleteNote(
      id: ID!
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


