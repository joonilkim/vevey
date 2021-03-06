import { coroutine, promisify } from 'bluebird'
import * as assert from 'assert-err'
import {
  InvalidInput,
  Unauthorized,
  wrapError
} from '@vevey/common'
import * as jwt from 'jsonwebtoken'
import { dynamoose } from '../connectors/dynamoose'

interface Payload {
  id: string
}

export interface TokenPayload  {
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

export const Model = dynamoose.model('Token', TokenSchema)

let secret = 'deadbeef'
let expiresIn = 10 * 60
let refreshExpiresIn = 30 * 24 * 60 * 60

export const init = (ops=<any>{}) => {
  secret = ops.secret || secret
  expiresIn  = ops.expiresIn || expiresIn
  refreshExpiresIn = ops.refreshExpiresIn || refreshExpiresIn
  return createModel
}

export type TokenModel = ReturnType<typeof createModel>

function createModel(){
  return class Token {
    static create(payload: Payload): Promise<TokenPayload> {
      const accessTokenPayload = {
        ...payload,
        exp: nowInSec() + expiresIn
      }

      const refreshTokenPayload = {
        ...payload,
        exp: nowInSec() + refreshExpiresIn
      }

      const saveToken = (tokens: TokenPayload) =>
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
        Token.sign(accessTokenPayload),
        Token.sign(refreshTokenPayload),
      ])
        .then(([accessToken, refreshToken]) => ({
          expiresIn,
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
        assert(data && data['userId'], Unauthorized)
        return data
      })

      const data = yield shouldExistsInDB()
      const userId = data['userId']

      yield Token.revoke(userId, refreshToken)
      return Token.create({ id: userId })
    })

    static verify(token: string): Promise<Payload> {
      return <any>new Promise((r, j) => (
        jwt.verify(token, secret, (er, decoded) =>
          er ? j(er) : r(<Payload>decoded)
        )))
        .catch(er => wrapJwtError(er))
    }

    static sign(payload: Payload): Promise<string> {
      return <any>promisify(jwt.sign)(payload, secret)
        .catch(er => wrapJwtError(er))
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

      let query = Model
        .query('userId')
        .eq(userId)
        .all()

      if(expiresOnly) {
        query = query.filter('exp').lt(nowInSec())
      }

      return query
        .exec()
        .then(deleteAll)
        .then(returnVoid)
    }
  }
}

const nowInSec = () => Math.floor(Date.now() / 1000)

const returnVoid = () => null

const wrapJwtError = er => {
  if (er.name === 'ValidationError') {
    throw wrapError(er, InvalidInput)
  }
  if(er.name === 'TokenExpiredError' ||
      er.name === 'JsonWebTokenError') {
    throw wrapError(er, Unauthorized)
  }
  throw er
}
