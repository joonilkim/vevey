import { pick, uniq, values } from 'underscore'
import * as DataLoader from 'dataloader'
import { fillEmpties } from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'
// @ts-ignore
const { AWS } = dynamoose


export enum UserStatus {
  Unconfirmed = 'Unconfirmed',
  Confirmed = 'Confirmed',
  Inactive = 'Inactive',
}

export interface UserPayload {
  id: string
  name: string
  email: string
  status: UserStatus
}

let connnector: AWS.DynamoDB.DocumentClient
let TableName: string

const batchGet = (keys: object[]) =>
  connnector.batchGet({
    RequestItems: {
      [TableName]: {
        // use _.values instead of Object.values to have same order
        Keys: uniq(keys, (v) => values(v).join(','))
      },
    },
  })
    .promise()
    .then(r => fillEmpties(keys, r.Responses[TableName]))

interface Options {}

export const init = (options=<Options>{}) => {
  connnector = dynamoose.documentClient()
  TableName = (process.env.DYNAMODB_PREFIX || '') + 'User'
  return createModel
}

export type UserModel = ReturnType<typeof createModel>

function createModel(){
  const dataloader = new DataLoader(batchGet)

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

      return dataloader.load({ id })
        .then(shouldBeActive)
        .then(sanitize)
    }
  }
}

// @ts-ignore
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
