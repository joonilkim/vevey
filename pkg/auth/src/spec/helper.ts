import * as _request from 'supertest'
import * as express from 'express'
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
    .post('/auth')
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

  return Promise.all(
    Object.values(tableNames).map(drop))
}

export const truncate = (Model, keys) =>
  Model.scan()
    .attributes(keys)
    .all()
    .exec()
    .then(Model.batchDelete)
