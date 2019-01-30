import { expect } from 'chai'
import { times } from '@vevey/common'
import { Note } from '../models/Note'
import app from '../app'
import {
  request,
  randInt,
  randStr,
  dropTables,
  requireError,
  throwIfError,
} from './helper.spec'

interface Obj { [_: string]: any }

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

const createRequest = (userId, { contents }) => {
  const query = `mutation {
    createNote(
      contents: "${contents}"
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  const headers = userId ? { Authorization: userId } : {}

  return request(app)
    .set(headers)
    .send({ query })
}

const updateRequest = (userId, id, { contents, pos }) => {
  const updateQuery = `mutation {
    updateNote(
      id: "${id}"
      contents: "${contents}"
      pos: ${pos}
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  const headers = userId ? { Authorization: userId } : {}

  return request(app)
    .set(headers)
    .send({ query: updateQuery })
}

const deleteRequest = (userId, id) => {
    const deleteQuery = `mutation {
      deleteNote(id: "${id}")
    }`

  const headers = userId ? { Authorization: userId } : {}

  return request(app)
    .set(headers)
    .send({ query: deleteQuery })
}

const getRequest = (userId, id) => {
  const query = `{
    note(id: "${id}") {
      ${NoteFields.join('\n')}
    }
  }`


  const headers = userId ? { Authorization: userId } : {}

  return request(app)
    .set(headers)
    .send({ query })
}

const listRequest = (userId, limit) => {
  const query = `{
    userNotes(
      userId: "${userId}"
      limit: ${limit}
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  const headers = userId ? { Authorization: userId } : {}

  return request(app)
    .set(headers)
    .send({ query })
}

describe('Note', () => {
  beforeEach(() => dropTables([Note['$__']['name']]))

  it('should create and update', async () => {
    const userId = randStr()

    // create
    const contents = randStr()
    const created: Obj = await createRequest(userId, { contents })
      .then(r => throwIfError(r))
      .then(r => r.body.data.createNote)

    NoteFields.forEach(f =>
      expect(created)
        .to.have.property(f)
        .to.be.exist
    )

    // require login
    await createRequest(null, { contents })
      .then(r => requireError('Unauthorized')(r))

    // update
    const toUpdate = {
      contents: randStr(),
      pos: new Date().getTime(),
    }
    const updated: Obj = await updateRequest(userId, created.id, toUpdate)
      .then(r => throwIfError(r))
      .then(r => r.body.data.updateNote)

    NoteFields.forEach(f =>
      expect(updated).to.have.property(f).to.be.exist)

    expect(updated.contents).to.be.equal(toUpdate.contents)
    expect(updated.pos).to.be.equal(toUpdate.pos)
    expect(new Date(updated.updatedAt))
      .to.be.above(new Date(created.updatedAt))

    // require login
    await updateRequest(null, created.id, toUpdate)
      .then(r => requireError('Unauthorized')(r))

    // require owner
    const notMe = randStr()
    await updateRequest(notMe, created.id, toUpdate)
      .then(r => requireError('Forbidden')(r))
  })

  it('should delete a note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    await deleteRequest(userId, created.id)
      .then(r => throwIfError(r))

    const note = await Note.get({ id: created.id })

    expect(note).to.have.property('id', created.id)
    expect(note).to.not.have.property('contents')

    // require login
    await deleteRequest(null, created.id)
      .then(r => requireError('Unauthorized')(r))
  })

  it('should get list', async () => {
    const userId = randStr()
    const limit = 2

    await seeding(userId, 10)

    const notes = await listRequest(userId, limit)
      .then(r => throwIfError(r))
      .then(r => r.body.data.userNotes)

    expect(notes).to.be.length(limit)

    // requires login
    await listRequest(null, limit)
      .then(r => requireError('Unauthorized')(r))

    // constraint check
    await listRequest(userId, -1)
      .then(r => requireError('ValidationError')(r))

    await listRequest(userId, 10000)
      .then(r => requireError('ValidationError')(r))

    // should filter deleted one
    const toDelete = notes[0].id
    await deleteRequest(userId, toDelete)

    const notes2 = await listRequest(userId, limit)
      .then(r => throwIfError(r))
      .then(r => r.body.data.userNotes)

    expect(notes2).to.be.length(limit)
    notes2.forEach(note =>
      expect(note.id).to.be.not.eq(toDelete))
  })

  it('should get a note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    const note = await getRequest(userId, created.id)
      .then(r => throwIfError(r))
      .then(r => r.body.data.note)

    NoteFields.forEach(f =>
      expect(note).to.have.property(f).to.be.exist)

    expect(note).to.have.property('id', created.id)
    expect(note).to.have.property('contents', created.contents)

    // requires login
    await getRequest(null, created.id)
      .then(r => requireError('Unauthorized')(r))

    // should filter deleted one
    await deleteRequest(userId, created.id)

    const data = await getRequest(userId, created.id)
      .then(r => throwIfError(r))
      .then(r => r.body.data)

    expect(data).to.have.property('note').to.be.not.exist
  })

})
