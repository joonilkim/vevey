import { expect } from 'chai'
import { times } from 'lodash'
import { Note } from '../models/Note'
import app from '../app'
import {
  request,
  randInt,
  randStr,
  dropTables,
  throwIfError,
} from './helper.spec'

const NoteFields = [
  'id', 'userId',
  'contents', 'pos',
  'createdAt', 'updatedAt',
]

const seeding = (userId, n=1) => {
  const createNote = pos =>
    new Note({
      id: randStr(),
      userId,
      contents: randStr(),
      pos,
    })

  if(n === 1) {
    const seed = createNote(randInt())
    return seed.save().then(() => seed)
  } else {
    const seeds = times(n).map(createNote)
    return Note.batchPut(seeds)
      .then(() => seeds)
  }
}

describe('userNotes', () => {
  beforeEach(() => dropTables([Note['$__']['name']]))

  it('should create and update', async () => {
    const userId = randStr()

    const query = `mutation {
      createNote(
        contents: "${randStr()}"
      ) {
        ${NoteFields.join(', ')}
      }
    }`

    const created = await request(app)
      .set({ Authorization: userId })
      .send({ query })
      .then(throwIfError)
      .then(r => r.body.data.createNote)

    NoteFields.forEach(f =>
      expect(created)
        .to.have.property(f)
        .to.be.exist
    )

    const toUpdate = {
      contents: randStr(),
      pos: new Date().getTime(),
    }

    const updateQuery = `mutation {
      updateNote(
        id: "${created.id}"
        contents: "${toUpdate.contents}"
        pos: ${toUpdate.pos}
      ) {
        ${NoteFields.join(', ')}
      }
    }`

    const updated = await request(app)
      .set({ Authorization: userId })
      .send({ query: updateQuery })
      .then(throwIfError)
      .then(r => r.body.data.updateNote)

    NoteFields.forEach(f =>
      expect(updated)
        .to.have.property(f)
        .to.be.exist
    )
    expect(updated.contents).to.be.equal(toUpdate.contents)
    expect(updated.pos).to.be.equal(toUpdate.pos)
    expect(new Date(updated.updatedAt))
      .to.be.above(new Date(created.updatedAt))
  })

  it('should allow to access only own notes', async () => {
    const userA = randStr()
    const userB = randStr()

    const created = await seeding(userA)

    const updateQuery = `mutation {
      updateNote(
        id: "${created['id']}"
        contents: "${randStr()}"
      ) {
        ${NoteFields.join(', ')}
      }
    }`

    const res = await request(app)
      .set({ Authorization: userB })
      .send({ query: updateQuery })

    expect(res.body).to.have.property('errors')
    expect(res.body.errors[0]).to.have.property('code', 'Forbidden')
  })

  it('should delete note', async () => {
    const userId = randStr()

    const created = await seeding(userId)

    const deleteQuery = `mutation {
      deleteNote(
        id: "${created['id']}"
      )
    }`

    await request(app)
      .set({ Authorization: userId })
      .send({ query: deleteQuery })
      .then(throwIfError)

    const note = await Note.get({ id: created['id'] })
    expect(note).to.have.property('id', created['id'])
    expect(note).to.not.have.property('contents')
  })

  it('should get list', async () => {
    const userId = randStr()
    const limit = 2

    await seeding(userId, 10)

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
