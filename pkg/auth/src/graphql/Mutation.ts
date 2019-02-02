import { Context } from '../Context'
import {
  BadRequest,
  ValidationError,
  wrapError
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
    .then(
      successResponse,
      er => handleError(er))
}

function confirmSignUp(
  _,
  { email, name, code, newPwd },
  { User }: Context,
) {
  return User.confirmSignUp({
    email, name, code, newPwd,
  })
  .then(successResponse)
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

function handleError(er){
  if (er.name === 'ValidationError') {
    throw wrapError(er, ValidationError)
  }

  // Don't wrap to pass throw vevey errors
  throw er
}

const successResponse = createResponse(true)

function createResponse(success){
  return () => ({ result: success })
}
