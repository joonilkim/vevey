import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { PromiseAll, times } from '@vevey/common'
import { Note } from '../models/Note'
import { router } from '../router'
import {
  // @ts-ignore
  print,
  request,
  randInt,
  randStr,
  truncate,
  throwIfError,
} from './helper.spec'

interface Obj { [_: string]: any }

//// Create App ////

process.env.TOKEN_SECRET = 'testtokensecret'
const secret = process.env.TOKEN_SECRET
const app = express()
app.use(router())


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

  const headers = userId ? ({
    Authorization: jwt.sign({ id: userId }, secret)
  }) : {}

  return request(app)
    .set(headers)
    .send({ query })
    .then(r => throwIfError(r))
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

  const headers = userId ? ({
    Authorization: jwt.sign({ id: userId }, secret)
  }) : {}

  return request(app)
    .set(headers)
    .send({ query: updateQuery })
    .then(r => throwIfError(r))
}

const deleteRequest = (userId, id) => {
    const deleteQuery = `mutation {
      deleteNote(id: "${id}"){
        result
      }
    }`

  const headers = userId ? ({
    Authorization: jwt.sign({ id: userId }, secret)
  }) : {}

  return request(app)
    .set(headers)
    .send({ query: deleteQuery })
    .then(r => throwIfError(r))
}

const getRequest = (userId, id) => {
  const query = `{
    note(id: "${id}") {
      ${NoteFields.join('\n')}
    }
  }`

  const headers = userId ? ({
    Authorization: jwt.sign({ id: userId }, secret)
  }) : {}

  return request(app)
    .set(headers)
    .send({ query })
    .then(r => throwIfError(r))
}

const listRequest = (userId, limit) => {
  const query = `{
    userNotes(
      userId: "${userId}"
      limit: ${limit}
    ) {
      items {
        ${NoteFields.join('\n')}
      }
    }
  }`

  const headers = userId ? ({
    Authorization: jwt.sign({ id: userId }, secret)
  }) : {}

  return request(app)
    .set(headers)
    .send({ query })
    .then(r => throwIfError(r))
}

describe('Note', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  beforeEach(async () => {
    await PromiseAll([
      truncate(Note, ['id']),
    ])
  })

  it('should create and update', async () => {
    const userId = randStr()

    // create
    const contents = randStr()
    const created: Obj = await createRequest(userId, { contents })
      .then(r => r.body.data.createNote)

    NoteFields.forEach(f =>
      created.should.have.property(f).to.be.exist)

    // require login
    await createRequest(null, { contents })
      .should.be.rejectedWith('Unauthorized')

    // update
    const toUpdate = {
      contents: randStr(),
      pos: new Date().getTime(),
    }
    const updated: Obj = await updateRequest(userId, created.id, toUpdate)
      .then(r => r.body.data.updateNote)

    NoteFields.forEach(f =>
      updated.should.have.property(f).to.be.exist)

    updated.contents.should.be.equal(toUpdate.contents)
    updated.pos.should.be.equal(toUpdate.pos)
    new Date(updated.updatedAt)
      .should.be.above(new Date(created.updatedAt))

    // require login
    await updateRequest(null, created.id, toUpdate)
      .should.be.rejectedWith('Unauthorized')

    // require owner
    const notMe = randStr()
    await updateRequest(notMe, created.id, toUpdate)
      .should.be.rejectedWith('Forbidden')
  })

  it('should delete a note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    const r = await deleteRequest(userId, created.id)
    r.body.data.deleteNote
      .should.have.property('result', true)

    const note = await Note.get({ id: created.id })

    note.should.have.property('id', created.id)
    note.should.not.have.property('contents')

    // require login
    await deleteRequest(null, created.id)
      .should.be.rejectedWith('Unauthorized')
  })

  it('should get list', async () => {
    const userId = randStr()
    const limit = 2

    await seeding(userId, 10)

    const notes = await listRequest(userId, limit)
      .then(r => r.body.data.userNotes.items)

    notes.should.be.length(limit)

    // requires login
    await listRequest(null, limit)
      .should.be.rejectedWith('Unauthorized')

    // constraint check
    await listRequest(userId, -1)
      .should.be.rejectedWith('ValidationError')

    await listRequest(userId, 10000)
      .should.be.rejectedWith('ValidationError')

    // should filter deleted one
    const toDelete = notes[0].id
    await deleteRequest(userId, toDelete)

    const moreNotes= await listRequest(userId, limit)
      .then(r => r.body.data.userNotes.items)

    moreNotes.should.be.length(limit)
    moreNotes.forEach(note =>
      note.id.should.not.eq(toDelete))
  })

  it('should get a note', async () => {
    const userId = randStr()

    const created: Obj = await seeding(userId)

    const note = await getRequest(userId, created.id)
      .then(r => r.body.data.note)

    NoteFields.forEach(f =>
      note.should.have.property(f).to.be.exist)

    note.should.have.property('id', created.id)
    note.should.have.property('contents', created.contents)

    // requires login
    await getRequest(null, created.id)
      .should.be.rejectedWith('Unauthorized')

    // should filter deleted one
    await deleteRequest(userId, created.id)

    const data = await getRequest(userId, created.id)
      .then(r => r.body.data)

    data.should.have.property('note', null)
  })

})
