import { DynamoDBConnector } from '../connectors/dynamodb'

export class Notes {
  constructor(protected conn: DynamoDBConnector){}

  async list(){
    return [{id: 1, user_id: 1}]
  }
}
