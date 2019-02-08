import * as _request from 'supertest'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { router } from '../router'
import { dynamoose } from '../connectors/dynamoose'

export const createApp = () =>
  express().use(router())

export const randStr = () =>
  Math.random().toString(36).substring(2, 15)

export const randInt = (max=10000, min=0) =>
  Math.floor(Math.random() * (max - min)) + min

export const request = app =>
  _request(app)
    .post('/app')
    .set('x-apigateway-event', '{}')
    .set('x-apigateway-context', '{}')

export const gqlRequest = (
  app, query: string, token?: { accessToken }
) => {
  const headers = token ?
    { Authorization: `Bearer ${token.accessToken}` } : {}

  return request(app)
    .set(headers)
    .send({ query })
}

export const makeToken = (payload: { id }) => {
  if(!payload) { return null }

  const secret = process.env.TOKEN_SECRET
  return { accessToken: jwt.sign(payload, secret) }
}

export const print = data => {
  console.dir(data, { depth: null })
  return data
}

export const throwIfError = r => {
  if(!r.body.errors) { return r }

  const code = r.body.errors[0]['code'] || 'Error'
  throw new Error(`${code}: ${r.body.errors[0].message}`)
}

export const truncate = (Model, keys) =>
  Model.scan()
    .attributes(keys)
    .all()
    .exec()
    .then(Model.batchDelete)

export const dropTables = (models: Array<{}>) => {
  const db = dynamoose.ddb()

  const ignoreNotFound = er => {
    if(er.code === 'ResourceNotFoundException') return
    throw er
  }

  const drop = tableName =>
    db.deleteTable({ TableName: tableName })
      .promise()
      .catch(ignoreNotFound)

  return Promise.all(
    models
      .map(m => m['$__']['name'])
      .map(drop))
}

export const initUserResource = async () => {
  const db = dynamoose.ddb()
  const TableName = process.env.USER_RESOURCE ||
    (process.env.DYNAMODB_PREFIX || '') + 'User'

  const hasTable = () =>
    db.describeTable({ TableName })
      .promise()
      .then(() => true)
      .catch(() => false)

  const createUserTable = () =>
    db.createTable({
      TableName,
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    }).promise()

  return hasTable()
    .then(r => r || <any>createUserTable())
}

export const createUsers = (users: Array<{ id, name, email}>) => {
  const db = dynamoose.documentClient()
  const TableName = process.env.USER_RESOURCE ||
    (process.env.DYNAMODB_PREFIX || '') + 'User'

  return db.batchWrite({
    RequestItems: {
      [TableName]: users.map(u => ({
        PutRequest: {
          Item: Object.entries(u).reduce((y, [k,v]) => ({
            [k]: v,
            ...y,
          }), {})
        }
      }))
    },
  }).promise()
}

