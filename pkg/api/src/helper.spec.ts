import * as _request from 'supertest'
import { DynamoDB } from './connectors/dynamodb.local'


export const randStr = () =>
  Math.random().toString(36).substring(2, 15)

export const randInt = (max=10000, min=0) =>
  Math.floor(Math.random() * (max - min)) + min

export const request = app => _request(app).post('/api/gql')

export const createDB = () => new DynamoDB()
