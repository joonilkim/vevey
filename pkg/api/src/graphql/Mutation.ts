import { Forbidden } from 'http-errors'
import * as assert from 'assert-err'
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

export const schema = `
  type Mutation {
    createNote(
      contents: String!
    ): Note
  }
`

export const resolvers = {
  Mutation: {
    createNote,
  }
}


