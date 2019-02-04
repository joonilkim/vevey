import * as assert from 'assert-err'
import { Context } from '../Context'
import { UserStatus } from '../models/User'
import {
  BadRequest,
  ValidationError,
  Unauthorized,
  Conflict,
  NotFound,
  wrapError,
} from '@vevey/common'

export const schema = `
  type Mutation {

    inviteMe(
      email: String! @constraint(format: email)
    ): MutationResponse! @auth(role: Guest)

    confirmSignUp(
      email: String! @constraint(format: email)
      name: String! @constraint(minLength: 4)
      code: String!
      newPwd: String! @constraint(format: password)
    ): MutationResponse! @auth(role: Guest)

    createToken(
      grantType: GrantType!
      email: String
      pwd: String
      refreshToken: String
    ): Token! @auth(role: Guest)

    changePassword(
      oldPwd: String!
      newPwd: String! @constraint(format: password)
    ): MutationResponse! @auth

    forgotPassword(
      email: String!
    ): MutationResponse! @auth(role: Guest)

    confirmForgotPassword(
      userId: ID!
      code: String!
      newPwd: String! @constraint(format: password)
    ): MutationResponse! @auth(role: Guest)

    unregister(
      pwd: String!
    ): MutationResponse! @auth
  }

  enum GrantType {
    credential
    refreshToken
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
    createToken,
    changePassword,
    forgotPassword,
    confirmForgotPassword,
    unregister,
  }
}

function inviteMe(
  _,
  { email },
  { me, User }: Context,
) {
  const suppressConflict = er => {
    if(er instanceof Conflict) return {}
    throw er
  }

  return User.invite({ email })
    .catch(suppressConflict)
    .then(returnSuccess)
}

function confirmSignUp(
  _,
  { email, name, code, newPwd },
  { me, User }: Context,
) {
  return User.confirmSignUp({
    email, name, code, newPwd,
  })
    .then(returnSuccess)
}

function createToken(
  _,
  { grantType, email, pwd, refreshToken },
  { me, User, Token }: Context,
) {
  const shouldExists = (user?) => {
    if(user && user.id)
      return user
    throw BadRequest(`Invalid email or password`)
  }

  // redirect NotFound to Unauthorized for security reason
  const suppressNotFound = er => {
    if(er instanceof NotFound)
      throw wrapError(<Error>er, Unauthorized)
    throw er
  }

  const byCredential = () => {
    assert(!!email && !!pwd, ValidationError, `Invalid email or pwd`)

    return User.findByEmail(email, [UserStatus.Confirmed])
      .then(shouldExists)
      .then(({ id }) => User.getUserByPwd(id, pwd))
      .then(user => Token.create({ id: user.id }))
      .catch(suppressNotFound)
  }

  const byRefreshToken = () => {
    assert(!!refreshToken, ValidationError, `Invalid refreshToken`)

    return Token.createByRefreshToken(refreshToken)
      .catch(suppressNotFound)
  }

  if(grantType === 'credential') { return byCredential() }
  if(grantType === 'refreshToken') { return byRefreshToken() }
  throw new BadRequest(`Invalid grantType: ${grantType}`)
}

function changePassword(
  _,
  { oldPwd, newPwd },
  { me, User }: Context,
) {
  return User.changePassword(me.id, oldPwd, newPwd)
    .then(returnSuccess)
}

function forgotPassword(
  _,
  { email },
  { me, User, Token }: Context,
) {
  // suppress exact message for security reason
  const suppressNotFound = er => {
    if(er instanceof NotFound) return {}
    throw er
  }

  return User.forgotPassword({ email })
    .catch(suppressNotFound)
    .then(returnSuccess)
}

function confirmForgotPassword(
  _,
  { userId, code, newPwd },
  { me, User, Token }: Context,
) {
  // suppress exact message for security reason
  const suppressNotFound = er => {
    if(er instanceof NotFound) return {}
    throw er
  }

  return User.confirmForgotPassword({ userId, code, newPwd })
    .catch(suppressNotFound)
    .then(returnSuccess)
}

function unregister(
  _,
  { pwd },
  { me, User, Token }: Context,
) {
  // suppress exact message for security reason
  const suppressNotFound = er => {
    if(er instanceof NotFound) return {}
    throw er
  }

  return User.unregister(me.id, pwd)
    .catch(suppressNotFound)
    .then(() => Token.revokeAll(me.id))
    .then(returnSuccess)
}

const returnSuccess = () => ({ result: true })
