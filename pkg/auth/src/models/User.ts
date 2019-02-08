import * as assert from 'assert-err'
import { generate as uuid } from 'short-uuid'
import { isEmpty } from 'underscore'
import * as bcrypt from 'bcrypt'
import {
  InvalidInput,
  NoPermission,
  Unauthorized,
  UserExists,
  UserDisabled,
} from '@vevey/common'
import { dynamoose } from '../connectors/dynamoose'

export enum UserStatus {
  Unconfirmed = 'Unconfirmed',
  Confirmed = 'Confirmed',
  Inactive = 'Inactive',
}

export interface UserPayload {
  id: string
  email: string
  name: string
  pwd: string
  confirmCode?: ConfirmCode
  status: UserStatus
}

interface ConfirmCode {
  code: string,
  exp: number,
}

export const UserSchema = new dynamoose.Schema({
  id: {
    type: String,
    hashKey: true,
    default: uuid,
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

const NIL = '_'

export const Model = dynamoose.model('User', UserSchema)
let saltRound = 8
let inviteCodeExpiresIn = 10*60
let resetCodeExpiresIn = 10*60

export const init = (ops=<any>{}) => {
  saltRound = ops.saltRound || saltRound
  inviteCodeExpiresIn = ops.inviteCodeExpiresIn || inviteCodeExpiresIn
  resetCodeExpiresIn = ops.resetCodeExpiresIn || resetCodeExpiresIn
  return createModel
}

export type UserModel = ReturnType<typeof createModel>

function createModel(){
  return class UserModel {
    static get(id: string): Promise<UserPayload> {
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
    ): Promise<UserPayload> {
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
          throw new UserExists()
        if(user && user.status === UserStatus.Inactive)
          throw new UserDisabled()
        return user
      }

      const confirmCode = {
        code: generateCode(),
        exp: nowInSec() + inviteCodeExpiresIn,
      }

      const invitedUser = {
        email,
        name: NIL,
        pwd: NIL,
        confirmCode,
        status: UserStatus.Unconfirmed,
      }

      const allStatus = Object.values(UserStatus)

      return UserModel.findByEmail(email, allStatus)
        .then(shouldNotRegistered)
        .then(() => Model.create(invitedUser))
        .then(() => confirmCode)
    }

    static confirmSignUp({
      email, name, code, newPwd,
    }): Promise<void> {
      const shouldBeInvited = (user?) => {
        if(!user || user.status !== UserStatus.Unconfirmed)
          throw new NoPermission()
        return user
      }

      const verifyCode = user => {
        const confirmCode = user.confirmCode || {}
        if(confirmCode.code === code &&
            confirmCode.exp > nowInSec())
          return user
        throw new InvalidInput('The code is invalid or expired.')
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
        bcrypt.hash(newPwd, saltRound)
          .then(hash => ({ user, hash }))

      return UserModel.findByEmail(email)
        .then(shouldBeInvited)
        .then(verifyCode)
        .then(withHash)
        .then(updateUser)
        .then(returnVoid)
    }

    static forgotPassword({ email }): Promise<ConfirmCode> {
      const shouldUserExists = (user?) => {
        assert(!isEmpty(user), InvalidInput)
        return user
      }

      const shouldBeConfirmed = (user?) => {
        assert(user.status === UserStatus.Confirmed, NoPermission)
        return user
      }

      const confirmCode = {
        code: generateCode(),
        exp: nowInSec() + resetCodeExpiresIn
      }

      const updateUser = user =>
        Model.update({ id: user.id }, { confirmCode })
          .then(() => user)

      return UserModel.findByEmail(email)
        .then(shouldUserExists)
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
        throw new InvalidInput('The code is invalid or expired.')
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
        bcrypt.hash(newPwd, saltRound)
          .then(hash => ({ user, hash }))

      const shouldUserExists = (user?) => {
        assert(!isEmpty(user), InvalidInput)
        return user
      }

      const shouldBeConfirmed = (user?) => {
        assert(user.status === UserStatus.Confirmed, NoPermission)
        return user
      }

      return UserModel.get(userId)
        .then(shouldUserExists)
        .then(shouldBeConfirmed)
        .then(verifyCode)
        .then(withHash)
        .then(updateUser)
        .then(returnVoid)
    }

    static unregister(id: string, pwd: string): Promise<void> {
      const inactivate = user =>
        Model.update({ id }, { status: UserStatus.Inactive })

      return UserModel.getUserByPwd(id, pwd)
        .then(inactivate)
        .then(returnVoid)
    }

    static delete(id: string): Promise<void>{
      return Model.delete(id)
    }

    static getUserByPwd(id: string, pwd: string): Promise<UserPayload> {
      const verifyPassword = user =>
        bcrypt.compare(pwd, user.pwd)
          .then(res => assert(res, Unauthorized))
          .then(() => user)

      const verifyStatus = async (user?) => {
        assert(!isEmpty(user), InvalidInput)
        assert(user.status === UserStatus.Confirmed, UserDisabled)
        return user
      }

      return UserModel.get(id)
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
        bcrypt.hash(newPwd, saltRound)
          .then(hash => ({ user, hash }))

      return UserModel.getUserByPwd(id, oldPwd)
        .then(withHash)
        .then(updateUser)
        .then(returnVoid)
    }
  }
} // class

function generateCode(){
  return (Math.floor(Math.random() * (999999 - 100000)) + 100000) + ''
}

const nowInSec = () => Math.floor(Date.now() / 1000)

const returnVoid = () => null
