import { Forbidden } from 'http-errors'
import { DynamoDB } from '../connectors/dynamodb'

interface Obj { [_: string]: any }

type Item = Obj

const prefix = () => process.env.DYNAMODB_PREFIX || ''

export class Note {
  constructor(protected db: DynamoDB){}

  listByUser(
    me: { id },
    userId: string,
    limit: number,
    pos?: number,
  ): Promise<Item[]> {

    if(me.id !== userId)
      throw new Forbidden()

    return this.db.query({
      TableName: prefix() + 'Notes',
      IndexName: 'byUser',
      KeyConditionExpression: 'userId = :userId and pos < :pos',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':pos': pos == null ? Number.MAX_SAFE_INTEGER : pos,
      },
      ScanIndexForward: false,
    })
  }

  create(){}
}
