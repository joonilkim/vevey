import * as assert from 'assert'
import { DynamoDB } from 'aws-sdk'
import * as DataLoader from 'dataloader'
import { PromiseAll } from '../utils'

class NotesLoader {
  protected loader = new DataLoader<string, {}>(this._batchGet.bind(this))
  protected hashKey = 'id'

  constructor(
    public conn: DynamoDB.DocumentClient,
    public tableName='notes'
  ){}

  async put(item: {}){
    const params = {
      TableName: this.tableName,
      Item: item,
    }

    await this.conn.put(params).promise()
  }

  async batchPut(items: {}[]){
    const params = {
      RequestItems: {
        [this.tableName]: items.map(item => ({
          PutRequest: { Item: item },
        }))
      },
    }

    await this.conn.batchWrite(params).promise()
  }

  async get(id: string): Promise<{}> {
    return await this.loader.load(id)
  }

  batchGet(ids: string[]): Promise<{}[]>{
    return PromiseAll(ids.map(id => this.loader.load(id)))
  }

  private async _batchGet(ids: string[]): Promise<{}[]> {
    const params = {
      RequestItems: {
        [this.tableName]: {
          Keys: ids.map(id => ({ id })),
          ConsistentRead: false,
        }
      }
    }

    const res = await this.conn.batchGet(params).promise()
    return res['Responses']![this.tableName]
  }
}


export class DynamoDBConnector {
  notes = new NotesLoader(this.conn, `${this.prefix}notes`)

  constructor(
    protected conn: DynamoDB.DocumentClient,
    protected prefix=''
  ){}
}
