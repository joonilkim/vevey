import { expect } from 'chai'
import { times } from 'lodash'
import { Note } from '../models/Note'
import app from '../app'
import {
  request,
  randStr,
  dropTables,
  shouldBeOk,
} from './helper.spec'

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
  before(() => dropTables([Note['$__']['name']]))

  it('should success', async () => {
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

    const res = await request(app)
      .set({ Authorization: userId })
      .send({ query })
    shouldBeOk(res)

    const data = res.body.data

    expect(data).to.have.property('userNotes')
    expect(data.userNotes).to.be.length(limit)
  })

})
