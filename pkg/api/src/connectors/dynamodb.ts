import * as AWS from 'aws-sdk'
import * as DataLoader from 'dataloader'

//// Utils ////

const batchLoad = (db, TableName) => keys =>
  db.batchGet({
    RequestItems: {
      [TableName]: {
        Keys: keys,
        ConsistentRead: false,
      }
    }
  })
  .promise()
  .then(res => res['Responses']![TableName])


//// DataLoader ////

export class DynamoDB {
  protected loaders = {}

  public ddb: AWS.DynamoDB.DocumentClient
  protected _ddb: AWS.DynamoDB

  constructor(config?: AWS.DynamoDB.ClientConfiguration){
    this.ddb = config ?
      new AWS.DynamoDB.DocumentClient(config) :
      new AWS.DynamoDB.DocumentClient()

    this._ddb = config ?
      new AWS.DynamoDB(config) :
      new AWS.DynamoDB()
  }

  protected loader(TableName){
    return this.loaders[TableName] =
      this.loaders[TableName] ||
      new DataLoader(batchLoad(this.ddb, TableName))
  }

  private execute = (command, resolver=(_=>_)) => params =>
    this.ddb[command](params).promise().then(resolver)

  private executeQuery = command => (params, Items=[]) =>
    this.ddb[command](params)
      .promise()
      .then(data => {
        Items = [...Items, ...data.Items]
        const finished = Items.length >= params.Limit

        if(!finished && data.LastEvaluatedKey){
          params.ExclusiveStartKey = data.LastEvaluatedKey
          return this.executeQuery(command)(params, Items)
        }
        return Items
      })

  scan = this.executeQuery('scan').bind(this)
  query = this.executeQuery('query').bind(this)
  get = this.execute('get', res => res.Item).bind(this)
  put = this.execute('put').bind(this)
  del = this.execute('delete').bind(this)
  update = this.execute('update').bind(this)
  batchGet = this.execute(
    'batchGet',
    res => Object.values(res.Responses)[0])
    .bind(this)
  batchWrite = this.execute('batchWrite').bind(this)
  createSet = this.execute('createSet').bind(this)
  transactionGet = this.execute('transactionGet').bind(this)
  transactionWrite = this.execute('transactionWrite').bind(this)

  // batchWrite for single table
  putAll = ({
    TableName,
    Items,
  }) =>
    this.batchWrite({
      RequestItems: {
        [TableName]: Items.map(Item => ({
          PutRequest: { Item }
        }))
      }
    })

  // batchGet for single table
  getAll = ({
    TableName,
    Keys,
    ...rest
  }) =>
    this.batchGet({
      RequestItems: {
        [TableName]: {
          Keys,
          ...rest,
        },
      }
    })

  // batchWrite for single table
  deleteAll = ({
    TableName,
    Keys,
  }) =>
    this.batchWrite({
      RequestItems: {
        [TableName]: Keys.map(Key => ({
          DeleteRequest: { Key }
        }))
      }
    })

  createTable = schema =>
    this._ddb.createTable(schema)
      .promise()

  dropTable = ({ TableName }) =>
    this._ddb.deleteTable({ TableName })
      .promise()
}
