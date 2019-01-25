process.env.NODE_ENV = 'test'
process.env.DYNAMODB_ENDPOINT = 'http://dynamodb:8000'
process.env.DYNAMODB_PREFIX = '__'

import { readFileSync } from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { PromiseAll } from './utils'
import { DynamoDB } from './connectors/dynamodb.local'


const prefix = process.env.DYNAMODB_PREFIX
const db = new DynamoDB()

const dbSchema = yaml.safeLoad(
  readFileSync(path.join(__dirname, './schema.yml'), 'utf8'))

export const createAllTables = () => {
  const create = schema =>
    db.createTable({
      ...schema,
      TableName: prefix + schema.TableName,
    })

  return PromiseAll(
    Object.values(dbSchema)
      .map(create))
}

export const dropAllTables = () => {
  const drop = schema =>
    db.dropTable({
      TableName: prefix + schema.TableName
    })

  return PromiseAll(
    Object.values(dbSchema)
      .map(drop))
}

beforeEach(createAllTables)
afterEach(dropAllTables)

