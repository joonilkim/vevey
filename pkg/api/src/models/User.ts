import { pick } from 'underscore'
import { dynamoose } from '../connectors/dynamoose'

export enum UserStatus {
  Unconfirmed = 'Unconfirmed',
  Confirmed = 'Confirmed',
  Inactive = 'Inactive',
}

export interface UserPayload {
  [_: string]: any
}

// @ts-ignore
const { AWS } = dynamoose

interface Options {
}

export type User = {
  get(me: { id }, id: string): Promise<UserPayload>
}

export const createModel = (options=<Options>{}) => {
  const connnector = dynamoose.documentClient()
  const TableName = process.env.USER_RESOURCE ||
    (process.env.DYNAMODB_PREFIX || '') + 'User'

  return {
    get(me: { id }, id: string): Promise<UserPayload> {
      const shouldBeActive = (user?) => {
        if(user && (
           user.status === UserStatus.Confirmed ||
           user.status === UserStatus.Unconfirmed))
          return user
        return null
      }

      let props = ['id', 'name']
      if(me.id === id)
        props = ['email', ...props]

      const sanitize = user => pick(user, props)

      return connnector.get({
        TableName,
        Key: { id }
      })
        .promise()
        .then(r => r.Item)
        .then(shouldBeActive)
        .then(sanitize)
        .catch(ignoreNotFound)
    }
  }
}

const ignoreNotFound = er => {
  if(er.code === 'ResourceNotFoundException') return null
  throw er
}

// @ts-ignore
function itemToProps(item){
  return Object.entries(item).reduce((y, [k, v]) => ({
    [k]: attrToProp(v),
    ...y,
  }), {})
}

function attrToProp(attr){
  if('N' in attr) { return Number(attr.N) }
  if('S' in attr) { return attr.S }
  throw new Error(`Not supported format: ${attr}`)
}


