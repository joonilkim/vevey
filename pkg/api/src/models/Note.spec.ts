import { expect } from 'chai'
import { pick } from 'lodash'
import { DynamoDB } from '../connectors/dynamodb.local'
import { Note } from './Note'

describe('Note', () => {
  describe('listByUser', () => {
    const TableName = '__Notes'
    const db = new DynamoDB()

    const userId = 'u1'

    const seeds = [
      { id: 'n3', userId, pos: 3 },
      { id: 'n2', userId, pos: 2 },
      { id: 'n1', userId, pos: 1 },
    ]

    beforeEach(() =>
      db.putAll({
        TableName,
        Items: seeds,
      }))

    afterEach(() =>
      db.deleteAll({
        TableName,
        Keys: seeds.map(x => pick(x, ['id']))
      }))

    it('should return results', async () => {
      const db = new DynamoDB()
      const model = new Note(db)

      const limit = 2
      const notes = await model.listByUser(
        { id: userId }, userId, limit, seeds[0].pos)

      expect(notes).to.be.length(limit)

      Object.keys(seeds[0]).forEach(k =>
        expect(notes[0]).to.have.property(k))
    })
  })
})
