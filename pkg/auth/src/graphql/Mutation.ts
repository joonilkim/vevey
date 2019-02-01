import * as assert from 'assert-err'
import { Context } from '../Context'
import {
  ValidationError,
  Conflict,
  wrapError
} from '@vevey/common'

export const schema = `
  type Mutation {

    inviteMe(
      email: String!
    ): MutationResponse!

    confirmSignUp(
      email: String!
      inviteCode: String!
      newPassword: String!
    ): MutationResponse!

  }

  type MutationResponse {
    result: Boolean!
  }
`

export const resolvers = {
  Mutation: {
    inviteMe,
  }
}

function inviteMe(
  _,
  { email },
  { User }: Context,
) {
  const nickname = extractNameFromEmail(email)
  assert(!!nickname, ValidationError, `Invalid email: ${email}`)

  return User.invite({
    email, nickname
  }).then(() => ({ result: true }))
    .catch(er => handleError(er))
}

/*
function confirmSignUp(
  _,
  { email, inviteCode, newPassword },
  { User }: Context,
) {
  return User.confirmSignUp({
    email, inviteCode, newPassword
  })
  .then(_ => ({ result: true }))
  .catch(er => {
    if (er.code === 'AliasExistsException' ||
        er.code === 'UsernameExistsException')
      throw new Conflict(`Already registered email: ${email}`)
    throw er
  })
}

function extractNameFromEmail(email){
  const match = /(.+)@/.exec(email)
  return match && match[1]
}
*/

function handleError(er){
  if (er.code === 'AliasExistsException' ||
      er.code === 'UsernameExistsException')
    throw wrapError(er, Conflict)

  // Don't wrap here
  throw er
}

const extractNameFromEmail = email => {
  const match = /(.+)@/.exec(email)
  return match && match[1]
}
