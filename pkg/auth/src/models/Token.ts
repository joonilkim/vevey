import * as assert from 'assert-err'
import {
  NotFound,
  PromiseAll,
} from '@vevey/common'
import * as jwt from 'jsonwebtoken'
import { dynamoose } from '../connectors/dynamoose'

interface Payload {
  id: string
}

export interface TokenResponse  {
  accessToken: string
  expiresIn: number
  refreshToken: string
}

export const TokenSchema = new dynamoose.Schema({
  userId: {
    type: String,
    hashKey: true,
  },
  token: {
    type: String,
    rangeKey: true,
    required: true,
  },
  exp: {
    type: Date,
    required: true,
  }
}, {
  throughput: {read: 1, write: 1},
  timestamps: true,
  saveUnknown: false,
})

const Model = dynamoose.model('tokens', TokenSchema)

export class Token {
  static Model = Model
  static secret = 'deadbeef'
  static expiresIn = 10 * 60
  static refreshExpiresIn = 30 * 24 * 60 * 60

  model

  constructor(params){
    this.model = new Model(params)
  }

  static create(payload: Payload): Promise<TokenResponse> {
    const accessTokenPayload = {
      ...payload,
      exp: nowInSec() + Token.expiresIn
    }

    const refreshTokenPayload = {
      ...payload,
      exp: nowInSec() + Token.refreshExpiresIn
    }

    const sign = payload =>
      new Promise((res, rej) =>
        jwt.sign(payload, Token.secret, (er, token) => (
          er ? rej(er) : res(token)
        )))

    const saveToken = (tokens: TokenResponse) =>
      // `Model.create` use `overwrite=false`,
      // This cause `attribute_not_exists` option to be added.
      // Because this only applied to hash key, not range key,
      // when creating a new model with different range key,
      // it emits `conditional fail error`
      new Model({
        userId: payload.id,
        token: tokens.refreshToken,
        exp: refreshTokenPayload.exp,
      })
      .save()
      .then(() => tokens)

    return PromiseAll([
      sign(accessTokenPayload),
      sign(refreshTokenPayload),
    ])
      .then(([accessToken, refreshToken]) => ({
        expiresIn: Token.expiresIn,
        accessToken,
        refreshToken,
      }))
      .then(saveToken)
  }

  static verify(token: string): Promise<Payload> {
    return new Promise((res, rej) =>
      jwt.verify(token, Token.secret, (er, decoded) => (
        er ? rej(er) : res(<Payload>decoded)
      )))
  }

  static async exchangeToken({ refreshToken }): Promise<TokenResponse>{
    const decoded = await Token.verify(refreshToken)

    const shouldExistsInDB = async () => {
      const data = await Model.get({ id: decoded.id, token: refreshToken })
      assert(!!data && data['userId'], NotFound)
      return data
    }

    const data = await shouldExistsInDB()
    const userId = data['userId']

    await PromiseAll([
      Token.revokeExpires(userId),
      Token.revoke(userId, refreshToken),
    ])
    return Token.create({ id: userId })
  }

  static revoke(userId, refreshToken): Promise<void> {
    return Model.delete({
      userId,
      token: refreshToken,
    })
  }

  static revokeAll(userId): Promise<void> {
    return Token.revokeExpires(userId, false)
  }

  static revokeExpires(userId, expiresOnly=true): Promise<void> {
    const keyOnly = ({ userId, token }) =>
      ({ userId, token })

    const deleteAll = items =>
      Model.batchDelete(items.map(keyOnly))

    const query = Model
      .query('userId')
      .eq(userId)
      .all()

    if(expiresOnly) {
      query.filter('exp').lt(nowInSec())
    }

    return query
      .exec()
      .then(deleteAll)
      .then(returnVoid)
  }
}

export const createModel = options => {
  Object.entries(options).forEach(([k, v]) => Token[k] = v)
  return Token
}

const nowInSec = () => Math.floor(Date.now() / 1000)

const returnVoid = () => null
