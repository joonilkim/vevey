import { generate as generateUUID } from 'short-uuid'
import { pickBy, Forbidden, wrapError } from '@vevey/common'
import { Context } from '../Context'

export const schema = `
  type Mutation {

    createNote(
      contents: String! @constraint(minLength: 1)
    ): Note @auth

    updateNote(
      id: ID!
      contents: String! @constraint(minLength: 1)
      pos: Integer
    ): Note @auth

    deleteNote(
      id: ID!
    ): MutationResponse! @auth
  }

  type MutationResponse {
    result: Boolean!
  }
`

export const resolvers = {
  Mutation: {
    createNote,
    updateNote,
    deleteNote,
  }
}

function createNote(
  _,
  { contents },
  { me, Note }: Context,
) {
  return Note.create({
    id: generateUUID(),
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
  const toUpdate = pickBy({ contents, pos }, v => !!v)
  const condition = {
    condition: 'userId = :userId',
    conditionValues: { userId: me.id },
  }

  // @ts-ignore
  return Note.update(key, toUpdate, condition)
    .catch(er => handleError(er))
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

  // @ts-ignore
  return Note.update(key, { $DELETE: toDelete }, condition)
    .then(
      () => ({ result: true }),
      er => handleError(er))
}

function handleError(er){
  if (er.code === 'ConditionalCheckFailedException') {
    throw wrapError(er, Forbidden)
  }

  // Don't wrap to pass throw vevey errors
  throw er
}


