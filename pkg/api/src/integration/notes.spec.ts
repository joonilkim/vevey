import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { times } from '@vevey/common'
import { Note } from '../models/Note'
import { router } from '../router'
import {
  // @ts-ignore
  print,
  randInt,
  randStr,
  truncate,
  gqlRequest,
  throwIfError,
} from './helper.spec'

//// Create App ////

process.env.TOKEN_SECRET = 'testtokensecret'
const app = express()
app.use(router())


//// Delaration ////

interface Obj { [_: string]: any }

const NoteFields = [
  'id', 'userId',
  'contents', 'pos',
  'createdAt', 'updatedAt',
]

//// Graphql queries ////

const createNote = (userId, { contents }) => {
  const query = `mutation {
    createNote(
      contents: "${contents}"
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const updateNote = (userId, id, { contents, pos }) => {
  const query = `mutation {
    updateNote(
      id: "${id}"
      contents: "${contents}"
      pos: ${pos}
    ) {
      ${NoteFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const deleteNote = (userId, id) => {
  const query= `mutation {
    deleteNote(id: "${id}"){
      result
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const getNote = (userId, id) => {
  const query = `{
    note(id: "${id}") {
      ${NoteFields.join('\n')}
    }
  }`

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

const allNotes = (userId, limit) => {
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

  const token = makeToken(userId)
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

describe('Note', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  // @ts-ignore
  const should = chai.should()

  describe('when create', () => {
    const userId = randStr()
    let created: Obj

    before(async () => {
      await Promise.all([
        truncate(Note, ['id']),
      ])
    })

    it('should pass', async () => {
      const contents = randStr()
      created = await createNote(userId, { contents })
        .then(r => r.body.data.createNote)

      NoteFields.forEach(f =>
        created.should.have.property(f).to.be.exist)
    })

    it('should require token', async () => {
      const contents = randStr()
      await createNote(null, { contents })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should update', async () => {
      const toUpdate = {
        contents: randStr(),
        pos: new Date().getTime(),
      }
      const updated: Obj = await updateNote(userId, created.id, toUpdate)
        .then(r => r.body.data.updateNote)

      NoteFields.forEach(f =>
        updated.should.have.property(f).to.be.exist)

      updated.contents.should.be.equal(toUpdate.contents)
      updated.pos.should.be.equal(toUpdate.pos)
      new Date(updated.updatedAt)
        .should.be.above(new Date(created.updatedAt))
    })

    it('should not update without token', async () => {
      const toUpdate = {
        contents: randStr(),
        pos: new Date().getTime(),
      }
      await updateNote(null, created.id, toUpdate)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be changed by others', async () => {
      const toUpdate = {
        contents: randStr(),
        pos: new Date().getTime(),
      }
      const notMe = randStr()

      await updateNote(notMe, created.id, toUpdate)
        .should.be.rejectedWith('Forbidden')
    })
  })

  describe('when delete', () => {
    const userId = randStr()
    let created: Obj

    before(async () => {
      await Promise.all([
        truncate(Note, ['id']),
      ])
      created = await seeding(userId)
    })

    it('should pass', async () => {
      const r = await deleteNote(userId, created.id)
      r.body.data.deleteNote
        .should.have.property('result', true)

      const note = await Note.get({ id: created.id })
      note.should.have.property('id', created.id)
      note.should.not.have.property('contents')
    })

    it('should not pass without token', async () => {
      await deleteNote(null, created.id)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not be queried', async () => {
      await allNotes(userId, 10)
        .then(r => r.body.data.userNotes.items)
        .should.eventually.be.length(0)

      await getNote(userId, created.id)
        .then(r => r.body.data.note)
        .should.eventually.not.exist
    })
  })

  describe('when get all', () => {
    const userId = randStr()
    const limit = 2

    before(async () => {
      await Promise.all([
        truncate(Note, ['id']),
      ])
      await seeding(userId, 10)
    })

    it('should pass', async () => {
      const notes = await allNotes(userId, limit)
        .then(r => r.body.data.userNotes.items)

      notes.should.be.length(limit)
    })

    it('should not pass without token', async () => {
      await allNotes(null, limit)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should not pass with invalid params', async () => {
      await allNotes(userId, -1)
        .should.be.rejectedWith('ValidationError')

      await allNotes(userId, 10000)
        .should.be.rejectedWith('ValidationError')
    })
  })

  describe('when get single', () => {
    const userId = randStr()
    let created: Obj

    before(async () => {
      await Promise.all([
        truncate(Note, ['id']),
      ])
      created = await seeding(userId)
    })

    it('should pass', async () => {
      const note = await getNote(userId, created.id)
        .then(r => r.body.data.note)

      NoteFields.forEach(f =>
        note.should.have.property(f).to.be.exist)

      note.should.have.property('id', created.id)
      note.should.have.property('contents', created.contents)
    })

    it('should not pass without token', async () => {
      await getNote(null, created.id)
        .should.be.rejectedWith('Unauthorized')
    })
  })

})

//// Helpers ////

function seeding(userId, n=1) {
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

function makeToken(userId: string){
  const secret = process.env.TOKEN_SECRET
  return { accessToken: jwt.sign({ id: userId }, secret) }
}
