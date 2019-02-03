import * as assert from 'assert-err'
import { Context } from '../Context'
import {
  Unauthorized,
  BadRequest,
} from '@vevey/common'

export const schema = `
  type Mutation {

    inviteMe(
      email: String!
    ): MutationResponse!

    confirmSignUp(
      email: String!
      name: String!
      code: String!
      newPwd: String!
    ): MutationResponse!

    login(
      email: String!
      pwd: String!
    ): Token!

    changePassword(
      oldPwd: String!
      newPwd: String!
    ): MutationResponse!
  }

  type MutationResponse {
    result: Boolean!
  }

  type Token {
    accessToken: String!
    expiresIn: Integer!
    refreshToken: String!
  }
`

export const resolvers = {
  Mutation: {
    inviteMe,
    confirmSignUp,
    login,
    changePassword,
  }
}

function inviteMe(
  _,
  { email },
  { User }: Context,
) {
  const suppressConflict = er => {
    if(er.code === 'Conflict') return {}
    throw er
  }

  return User.invite({ email })
    .catch(suppressConflict)
    .then(returnSuccess)
}

function confirmSignUp(
  _,
  { email, name, code, newPwd },
  { User }: Context,
) {
  return User.confirmSignUp({
    email, name, code, newPwd,
  })
    .then(returnSuccess)
}

function login(
  _,
  { email, pwd },
  { User, Token }: Context,
) {
  const shouldExists = (user?) => {
    if(user && user.id)
      return user
    throw BadRequest(`Invalid email or password`)
  }

  return User.findByEmail(email)
    .then(shouldExists)
    .then(({ id }) => User.getUserByPwd(id, pwd))
    .then(user => Token.create({ id: user.id }))
}

function changePassword(
  _,
  { oldPwd, newPwd },
  { me, User, Token }: Context,
) {
  assert(!!me.id, Unauthorized)

  return User.changePassword(me.id, oldPwd, newPwd)
    .then(returnSuccess)
}

const returnSuccess = createResponse(true)

function createResponse(success){
  return () => ({ result: success })
}