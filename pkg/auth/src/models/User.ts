import * as assert from 'assert'
import { Cognito, UserType } from '../connectors/Cognito'
import { generate as generateUUID } from 'short-uuid'
import { ValidationError } from '@vevey/common'


const parseUser = (user?: UserType): {[_: string]: any} => {
  if(!user)
    return user

  return {
    id: user.Username,
    ...user.Attributes.reduce((y, x) => ({
      ...y,
      [x.Name]: x.Value
    }), {})
  }
}

const toAttrs = (obj) =>
  Object.keys(obj).map(k => ({
    Name: k,
    Value: obj[k],
  }))

const handleNotFound = (result) => er => {
  if(er.code === 'UserNotFoundException')
    return result
  throw er
}

export class User {
  constructor(
    protected cognito: Cognito,
    protected userPoolId=process.env.USER_POOL_ID
  ){
    assert(!!process.env.USER_POOL_ID)
  }

  invite({ email, nickname }){
    assert(!!email && !!nickname)
    validateEmail(email)

    const id = generateUUID()
    const params = {
      UserPoolId: this.userPoolId,
      Username: id,
      DesiredDeliveryMediums: [ "EMAIL" ],
      // AliasExistsException if alias is already exists
      ForceAliasCreation: false,
      // if resend, UserNotFoundException can be occur
      UserAttributes: toAttrs({
        email,
        nickname,
        email_verified: "True",
      }),
    }

    return this.cognito.adminCreateUser(params)
      .promise()
      .then(data => parseUser(data.User))
      .catch(er => handleNotFound(null)(er))
  }

  deleteUser(id){
    assert(!!id)

    const params = {
      UserPoolId: this.userPoolId,
      Username: id,
    }
    return this.cognito.adminDeleteUser(params)
      .promise()
      .catch(er => handleNotFound(null)(er))
  }

  findByEmail(email){
    assert(!!email)

    const filter = `email = "${email}"`
    return this.listUsers({ filter })
  }

  listUsers({ filter }){
    let params = { UserPoolId: this.userPoolId }
    if(filter)
      params['Filter'] = filter

    return this.cognito.listUsers(params)
      .promise()
      .then(data => parseUser(data.Users[0]))
      .catch(er => handleNotFound([])(er))
  }
}

function validateEmail(email){
  if (!/\S+@\S+\.\S+/.test(email))
    throw new ValidationError(`Invalid email: ${email}`)
}
