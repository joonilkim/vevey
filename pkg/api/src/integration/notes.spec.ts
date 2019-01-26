import { expect } from 'chai'
import { times } from 'lodash'
import { Note } from '../models/Note'
import app from '../app'
import {
  request,
  randStr,
  dropTables,
  throwIfError,
} from './helper.spec'

const NoteFields = [
  'id', 'userId', 'contents',
  'pos', 'createdAt', 'updatedAt'
]

const seeding = userId => {
  const createNote = i => new Note({
    id: randStr(),
    userId,
    contents: randStr(),
    pos: i,
  })

  const seeds = times(10)
    .map(createNote)

  return Note.batchPut(seeds)
}

describe('userNotes', () => {
  beforeEach(() => dropTables([Note['$__']['name']]))

  it('should create', async () => {
    const query = `mutation {
      createNote(
        contents: "${randStr()}"
      ) {
        ${NoteFields.join(', ')}
      }
    }`

    const userId = randStr()

    const data = await request(app)
      .set({ Authorization: userId })
      .send({ query })
      .then(throwIfError)
      .then(r => r.body.data)

    NoteFields.forEach(f =>
      expect(data.createNote)
        .to.have.property(f)
        .to.be.exist
    )
  })

  it('should get list', async () => {
    const userId = randStr()
    const limit = 2

    await seeding(userId)

    const query = `{
      userNotes(userId: "${userId}", limit: ${limit}) {
        id,
        userId,
        pos
      }
    }`

    const data = await request(app)
      .set({ Authorization: userId })
      .send({ query })
      .then(throwIfError)
      .then(r => r.body.data)

    expect(data)
      .to.have.property('userNotes')
      .to.be.length(limit)
  })

})
