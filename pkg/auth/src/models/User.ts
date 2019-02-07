import * as assert from 'assert-err'
import { generate as generateUUID } from 'short-uuid'
import * as bcrypt from 'bcrypt'
import {
  BadRequest,
  Unauthorized,
  Conflict,
  NotFound,
  Forbidden,
} from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'

export enum UserStatus {
  Unconfirmed = 'Unconfirmed',
  Confirmed = 'Confirmed',
  Inactive = 'Inactive',
}

export interface UserResponse {
  [_: string]: any
}

interface ConfirmCode {
  code: string,
  exp: number,
}

export const UserSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
    default: generateUUID
  },
  email: {
    type: String,
    required: true,
    index: {
      global: true,
      name: 'byEmail',
      project: true,
      throughput: 1,
    },
    validate: s => !!s
  },
  name: {
    type: String,
    required: true,
    trim: true,
    validate: s => !!s
  },
  pwd: {
    type: String,
    required: true,
    trim: true,
  },
  confirmCode: {
    type: Object, // { code, exp }
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.Unconfirmed,
  }
}, {
  throughput: {read: 1, write: 1},
  timestamps: true,
  saveUnknown: false,
})

const Model = dynamoose.model('User', UserSchema)

const NIL = '_'

export class User {
  static Model = Model
  static saltRound=8
  static inviteCodeExpiresIn=10*60
  static resetCodeExpiresIn=10*60

  model

  constructor(params){
    this.model = new Model(params)
  }

  static get(id: string): Promise<UserResponse> {
    const shouldBeActive = (user?) => {
      if(user && (
         user.status === UserStatus.Confirmed ||
         user.status === UserStatus.Unconfirmed))
        return user
      return null
    }

    return Model.get({ id })
      .then(shouldBeActive)
  }

  static findByEmail(
    email: string,
    statuses=[ UserStatus.Confirmed, UserStatus.Unconfirmed ],
  ): Promise<UserResponse> {
    const shouldBeInStatus = (user?) => {
      if(user && statuses.includes(user.status))
        return user
      return null
    }

    return Model
      .query('email')
      .eq(email)
      .limit(1)
      .descending()
      .exec()
      .then(items => items && items[0])
      .then(shouldBeInStatus)
  }

  static invite({ email }): Promise<ConfirmCode> {
    const shouldNotRegistered = (user?) => {
      if(user && user.status === UserStatus.Confirmed)
        throw new Conflict('Already registered')
      if(user && user.status === UserStatus.Inactive)
        throw new Forbidden('In inactive status')
      return user
    }

    const confirmCode = {
      code: generateCode(),
      exp: nowInSec() + User.inviteCodeExpiresIn,
    }

    const invitedUser = {
      email,
      name: NIL,
      pwd: NIL,
      confirmCode,
      status: UserStatus.Unconfirmed,
    }

    const allStatus = Object.values(UserStatus)

    return User.findByEmail(email, allStatus)
      .then(shouldNotRegistered)
      .then(() => Model.create(invitedUser))
      .then(() => confirmCode)
  }

  static confirmSignUp({
    email, name, code, newPwd,
  }): Promise<void> {
    const shouldBeInvited = (user?) => {
      if(!user || user.status !== UserStatus.Unconfirmed)
        throw new Forbidden('Not invited user')
      return user
    }

    const verifyCode = user => {
      const confirmCode = user.confirmCode || {}
      if(confirmCode.code === code &&
          confirmCode.exp > nowInSec())
        return user
      throw new BadRequest('Invalid or Expired code')
    }

    const updateUser = ({ user, hash }) =>
      Model.update({
        id: user.id
      }, {
        $PUT: { name, pwd: hash, status: UserStatus.Confirmed },
        $DELETE: { confirmCode: null },
      })
      .then(() => user)

    const withHash = user =>
      bcrypt.hash(newPwd, User.saltRound)
        .then(hash => ({ user, hash }))

    return User.findByEmail(email)
      .then(shouldBeInvited)
      .then(verifyCode)
      .then(withHash)
      .then(updateUser)
      .then(returnVoid)
  }

  static forgotPassword({ email }): Promise<ConfirmCode> {

    const confirmCode = {
      code: generateCode(),
      exp: nowInSec() + User.resetCodeExpiresIn
    }

    const updateUser = user =>
      Model.update({ id: user.id }, { confirmCode })
        .then(() => user)

    return User.findByEmail(email)
      .then(shouldBeConfirmed)
      .then(updateUser)
      .then(() => confirmCode)
  }

  static confirmForgotPassword({
    userId, code, newPwd,
  }): Promise<void> {
    const verifyCode = user => {
      const confirmCode = user.confirmCode || {}
      if(confirmCode.code === code &&
          confirmCode.exp > nowInSec())
        return user
      throw new BadRequest('Invalid or Expired code')
    }

    const updateUser = ({ user, hash }) =>
      Model.update({
        id: user.id
      }, {
        $PUT: { pwd: hash },
        $DELETE: { confirmCode: null },
      })
      .then(() => user)

    const withHash = user =>
      bcrypt.hash(newPwd, User.saltRound)
        .then(hash => ({ user, hash }))

    return User.get(userId)
      .then(shouldBeConfirmed)
      .then(verifyCode)
      .then(withHash)
      .then(updateUser)
      .then(returnVoid)
  }

  static unregister(id: string, pwd: string): Promise<void> {
    const inactivate = user =>
      Model.update({ id }, { status: UserStatus.Inactive })

    return User.getUserByPwd(id, pwd)
      .then(inactivate)
      .then(returnVoid)
  }

  static delete(id: string): Promise<void>{
    return Model.delete(id)
  }

  static getUserByPwd(id: string, pwd: string): Promise<UserResponse> {
    const shouldNotNil = async pwd => {
      if(pwd !== NIL) return
      throw new Forbidden()
    }

    const verifyPassword = user =>
      bcrypt.compare(pwd, user.pwd)
        .then(res => assert(res, Unauthorized))
        .then(() => user)

    const verifyStatus = async (user?) => {
      assert(!!user, NotFound)
      assert(user.status === UserStatus.Confirmed,
        Forbidden, 'User is not in active')
      return user
    }

    return shouldNotNil(pwd)
      .then(() => User.get(id))
      .then(verifyStatus)
      .then(verifyPassword)
  }

  static changePassword(
    id: string,
    oldPwd: string,
    newPwd: string
  ): Promise<void> {
    const updateUser = ({ user, hash }) =>
      Model.update({ id: user.id }, { pwd: hash })
        .then(() => user)

    const withHash = user =>
      bcrypt.hash(newPwd, User.saltRound)
        .then(hash => ({ user, hash }))

    return User.getUserByPwd(id, oldPwd)
      .then(withHash)
      .then(updateUser)
      .then(returnVoid)
  }

  delete(): Promise<void> {
    return this.model.delete()
  }
} // class

export const createModel = (options={}) => {
  Object.entries(options).forEach(([k, v]) => User[k] = v)
  return User
}

function generateCode(){
  return (Math.floor(Math.random() * (999999 - 100000)) + 100000) + ''
}

const nowInSec = () => Math.floor(Date.now() / 1000)

const returnVoid = () => null

const shouldBeConfirmed = (user?) => {
  if(!user || user.status !== UserStatus.Confirmed)
    throw new NotFound()
  return user
}
