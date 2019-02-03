import * as _request from 'supertest'
import { PromiseAll } from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'


export const randStr = () =>
  Math.random().toString(36).substring(2, 15)

export const randInt = (max=10000, min=0) =>
  Math.floor(Math.random() * (max - min)) + min

export const request = app =>
  _request(app)
    .post('/api/gql')
    .set('x-apigateway-event', '{}')
    .set('x-apigateway-context', '{}')

export const print = data => {
  console.info(data)
  return data
}

export const throwIfError = r => {
  if(!r.body.errors) return r

  const code = r.body.errors[0]['code'] || 'Error'
  throw new Error(`${code}: ${r.body.errors[0].message}`)
}

export const dropTables = tableNames => {
  const db = dynamoose.ddb()

  const ignoreNotFound = er => {
    if(er.code === 'ResourceNotFoundException') return
    throw er
  }

  const drop = tableName =>
    db.deleteTable({ TableName: tableName })
      .promise()
      .catch(ignoreNotFound)

  return PromiseAll(
    Object.values(tableNames).map(drop))
}

export const truncate = (Model, keys) =>
  Model.scan()
    .attributes(keys)
    .all()
    .exec()
    .then(Model.batchDelete)