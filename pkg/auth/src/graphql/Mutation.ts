import * as assert from 'assert-err'
import { Context } from '../Context'
import { UserStatus } from '../models/User'
import {
  InvalidInput,
  MissingParameter,
  Unauthorized,
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
  { me, User, Mailer }: Context,
) {
  return User.invite({ email })
    .then(code => Mailer.sendInvitation(email, code))
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
    assert(user && user.id, Unauthorized)
    return user
  }

  const byCredential = () => {
    assert(!!email && !!pwd, MissingParameter)

    return User.findByEmail(email, [UserStatus.Confirmed])
      .then(shouldExists)
      .then(({ id }) => User.getUserByPwd(id, pwd))
      .then(user => Token.create({ id: user.id }))
  }

  const byRefreshToken = () => {
    assert(!!refreshToken, MissingParameter)

    return Token.createByRefreshToken(refreshToken)
  }

  if(grantType === 'credential') { return byCredential() }
  if(grantType === 'refreshToken') { return byRefreshToken() }
  throw new InvalidInput(`Invalid grantType: ${grantType}`)
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
  { me, User, Token, Mailer }: Context,
) {
  return User.forgotPassword({ email })
    .then(code => Mailer.sendConfirmCode(email, code))
    .then(returnSuccess)
}

function confirmForgotPassword(
  _,
  { userId, code, newPwd },
  { me, User, Token, Mailer }: Context,
) {
  return User.confirmForgotPassword({ userId, code, newPwd })
    .then(returnSuccess)
}

function unregister(
  _,
  { pwd },
  { me, User, Token }: Context,
) {
  return User.unregister(me.id, pwd)
    .then(() => Token.revokeAll(me.id))
    .then(returnSuccess)
}

const returnSuccess = () => ({ result: true })
