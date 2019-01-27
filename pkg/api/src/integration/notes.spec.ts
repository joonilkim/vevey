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

  return request(app)
    .set({ Authorization: userId })
    .send({ query })
}

const updateRequest = (id, userId, { contents, pos }) => {
  const updateQuery = `mutation {
    updateNote(
      id: "${id}"
      contents: "${contents}"
      pos: ${pos}
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  return request(app)
    .set({ Authorization: userId })
    .send({ query: updateQuery })
}

const deleteRequest = (id, userId) => {
    const deleteQuery = `mutation {
      deleteNote(id: "${id}")
    }`

    return request(app)
      .set({ Authorization: userId })
      .send({ query: deleteQuery })
}

const getRequest = (id, userId) => {
  const query = `{
    note(id: "${id}") {
      ${NoteFields.join('\n')}
    }
  }`

  return request(app)
    .set({ Authorization: userId })
    .send({ query })
}

const listRequest = (userId, limit) => {
  const query = `{
    userNotes(userId: "${userId}", limit: ${limit}) {
      ${NoteFields.join('\n')}
    }
  }`

  return request(app)
    .set({ Authorization: userId })
    .send({ query })
}

describe('userNotes', () => {
  beforeEach(() => dropTables([Note['$__']['name']]))

  it('should create and update', async () => {
    const userId = randStr()

    const contents = randStr()
    const created: Obj = await createRequest(userId, { contents })
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
    const updated: Obj = await updateRequest(created.id, userId, toUpdate)
      .then(throwIfError)
      .then(r => r.body.data.updateNote)

    NoteFields.forEach(f =>
      expect(updated).to.have.property(f).to.be.exist)

    expect(updated.contents).to.be.equal(toUpdate.contents)
    expect(updated.pos).to.be.equal(toUpdate.pos)
    expect(new Date(updated.updatedAt))
      .to.be.above(new Date(created.updatedAt))
  })

  it('should allow to access only own notes', async () => {
    const [userA, userB] = [randStr(), randStr()]

    const created: Obj = await seeding(userA)

    const toUpdate = {
      contents: randStr(),
      pos: new Date().getTime(),
    }
    const res = await updateRequest(created.id, userB, toUpdate)

    expect(res.body).to.have.property('errors')
    expect(res.body.errors[0]).to.have.property('code', 'Forbidden')
  })

  it('should delete note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    await deleteRequest(created.id, userId)
      .then(throwIfError)

    const note = await Note.get({ id: created.id })

    expect(note).to.have.property('id', created.id)
    expect(note).to.not.have.property('contents')
  })

  it('should get list', async () => {
    const userId = randStr()
    const limit = 2

    await seeding(userId, 10)

    const notes = await listRequest(userId, limit)
      .then(throwIfError)
      .then(r => r.body.data.userNotes)

    expect(notes).to.be.length(limit)

    const toDelete = notes[0].id
    await deleteRequest(toDelete, userId)

    const notes2 = await listRequest(userId, limit)
      .then(throwIfError)
      .then(r => r.body.data.userNotes)

    expect(notes2).to.be.length(limit)
    notes2.forEach(note =>
      expect(note.id).to.be.not.eq(toDelete))
  })

  it('should get a note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    const note = await getRequest(created.id, userId)
      .then(throwIfError)
      .then(r => r.body.data.note)

    NoteFields.forEach(f =>
      expect(note).to.have.property(f).to.be.exist)

    expect(note).to.have.property('id', created.id)
    expect(note).to.have.property('contents', created.contents)

    await deleteRequest(created.id, userId)

    const data = await getRequest(created.id, userId)
      .then(throwIfError)
      .then(r => r.body.data)

    expect(data).to.have.property('note').to.be.not.exist
  })

})
