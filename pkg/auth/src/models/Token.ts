import { coroutine, promisify } from 'bluebird'
import * as assert from 'assert-err'
import { NotFound } from '@vevey/common'
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
  expires: {
    ttl: 30*24*60*60,
    attribute: 'exp',
    returnExpiredItems: false,
  },
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

    const sign = payload => promisify(jwt.sign)(payload, Token.secret)

    const saveToken = (tokens: TokenResponse) =>
      // `Model.create` use `overwrite=false`,
      // This cause `attribute_not_exists` option to be added.
      // Because this only applied to hash key, not range key,
      // when creating a new model with different range key,
      // it emits `conditional fail error`
      new Model({
        userId: payload.id,
        token: tokens.refreshToken,
        exp: new Date(refreshTokenPayload.exp * 1000),
      })
      .save()
      .then(() => tokens)

    return Promise.all([
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

  static createByRefreshToken = coroutine(function*(refreshToken){
    const decoded = yield Token.verify(refreshToken)

    const shouldExistsInDB = coroutine(function*(){
      const data = yield Model.get(
        { userId: decoded.id, token: refreshToken })
      assert(!!data && !!data['userId'], NotFound)
      return data
    })

    const data = yield shouldExistsInDB()
    const userId = data['userId']

    yield Token.revoke(userId, refreshToken)
    return Token.create({ id: userId })
  })

  static verify(token: string): Promise<Payload> {
    return new Promise((r, j) => (
      jwt.verify(token, Token.secret, (er, decoded) =>
        er ? j(er) : r(<Payload>decoded)
      )))
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
