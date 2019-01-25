import { readFileSync } from 'fs'
import * as path from 'path'
import { expect } from 'chai'
import { pick } from 'lodash'
import * as yaml from 'js-yaml'
import { DynamoDB } from './dynamodb.local'

const schema = yaml.safeLoad(
  readFileSync(path.join(__dirname, 'schema.spec.yml'), 'utf8'))

describe('dynamodb', () => {
  const testTable = '__Test'
  const db = new DynamoDB()

  beforeEach(() => db.createTable(schema))
  afterEach(() => db.dropTable({ TableName: testTable }))

  it('should get data', async () => {
    const TableName = testTable

    const seed = { id: 'n1', userId: 'u1', pos: 1 }

    await db.put({
      TableName,
      Item: seed
    })

    const res = await db.get({
      TableName,
      Key: { id: seed.id }
    })

    for(const [k, v] of Object.entries(seed)){
      expect(res).to.have.property(k, v)
    }
  })

  it('should get by batch', async () => {
    const TableName = testTable

    const seeds = [
      { id: 'n1', userId: 'u1', pos: 1 },
    ]

    await db.putAll({
      TableName,
      Items: seeds,
    })

    const res = await db.getAll({
      TableName,
      Keys: seeds.map(x => pick(x, ['id']))
    })

    expect(res).to.have.length(seeds.length)
    for(const [k, v] of Object.entries(seeds[0])){
      expect(res[0]).to.have.property(k, v)
    }
  })

  it('should run query', async () => {
    const TableName = testTable
    const IndexName = 'byUser'

    const userId = 'u1'
    const seeds = [
      { id: 'n3', userId, pos: 3 },
      { id: 'n2', userId, pos: 2 },
      { id: 'n1', userId, pos: 1 },
    ]

    await db.putAll({
      TableName,
      Items: seeds,
    })

    const query = (userId, pos, Limit) =>
      db.query({
        TableName,
        IndexName,
        KeyConditionExpression: `
          userId = :userId and pos < :pos
        `,
        ExpressionAttributeValues: {
          ':userId': userId,
          ':pos': pos == null ? Number.MAX_SAFE_INTEGER : pos,
        },
        ScanIndexForward: false,
        Limit,
      })

    const limit = 2
    const res = await query(userId, null, limit)
    expect(res).to.be.length(limit)

    for(const [k, v] of Object.entries(seeds[0])){
      expect(res[0]).to.have.property(k, v)
    }

    const more = await query(userId, limit, res[res.length - 1].pos)
    expect(more).to.be.length(seeds.length - limit)
  })

})
