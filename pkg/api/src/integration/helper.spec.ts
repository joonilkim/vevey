import { inspect } from 'util'
import * as _request from 'supertest'
import { PromiseAll } from '../utils'
import dynamoose from '../connectors/dynamoose'


export const randStr = () =>
  Math.random().toString(36).substring(2, 15)

export const randInt = (max=10000, min=0) =>
  Math.floor(Math.random() * (max - min)) + min

export const request = app =>
  _request(app)
    .post('/api/gql')
    .set('x-apigateway-event', '{}')
    .set('x-apigateway-context', '{}')

export const dropTables = tableNames => {
  const db = dynamoose.ddb()
  const prefix = process.env.DYNAMODB_PREFIX || ''

  const ignoreNotFound = er => {
    if(er.code === 'ResourceNotFoundException') return
    throw er
  }

  const drop = tableName =>
    db.deleteTable({
      TableName: prefix + tableName
    })
    .promise()
    .catch(ignoreNotFound)

  return PromiseAll(
    Object
      .values(tableNames)
      .map(drop))
}

export const print = data => {
  console.info(data)
  return data
}

export const throwIfError = r => {
  if(!r.body.errors)
    return r
  throw new Error(r.body.errors[0].message)
}

export const requireError = code => r => {
  if(r.body.errors && r.body.errors[0].code === code)
    return r

  const msg = r.body.errors ? inspect(r.body.errors[0], false, null) : '{}'
  throw new Error(`Expected: ${inspect({ code })}, but got: ${msg}`)
}
