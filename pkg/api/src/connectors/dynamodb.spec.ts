import { expect } from 'chai'
import { DynamoDB } from 'aws-sdk'
import { DynamoDBConnector } from './dynamodb'
import * as schema from './schema.spec'
import { PromiseAll } from '../utils'


const config = {
  apiVersion: '2012-10-08',
  region: 'test-region',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://dynamodb:8000',
}

const ddb = new DynamoDB(config)

const ddbClient = new DynamoDB.DocumentClient(config)


describe('connector', () => {

  describe('dynamodb', () => {
    beforeEach(() => {
      return PromiseAll<any>(
        Object.values(schema).map(tab => (
          ddb.createTable(tab).promise()
        ))
      )
    })

    afterEach(() => {
      return PromiseAll<any>(
        Object.values(schema).map(tab => (
          ddb.deleteTable({TableName: tab.TableName}).promise()
        ))
      )
    })

    it('should get notes', async () => {
      const connector = new DynamoDBConnector(ddbClient)

      const seed = { id: 'n1', user_id: 'u1', pos: 1 }

      await connector.notes.put(seed)

      const res = await connector.notes.get(seed.id)

      for(const [k, v] of Object.entries(seed)){
        expect(res).to.have.property(k, seed[k])
      }
    })

    it('should get notes by batch', async () => {
      const connector = new DynamoDBConnector(ddbClient)

      const seeds = [
        { id: 'n1', user_id: 'u1', pos: 1 }
      ]

      await connector.notes.batchPut(seeds)

      const res = await connector.notes.batchGet(seeds.map(x => x.id))

      expect(res).to.have.length(seeds.length)
      for(const [k, v] of Object.entries(seeds[0])){
        expect(res[0]).to.have.property(k, seeds[0][k])
      }
    })

  })
})
