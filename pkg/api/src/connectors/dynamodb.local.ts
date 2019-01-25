import { DynamoDB as _DynamoDB } from './dynamodb'

export class DynamoDB extends _DynamoDB {
  constructor(){
    super({
      region: 'localhost',
      endpoint: 'http://dynamodb:8000'
    })
  }
}
