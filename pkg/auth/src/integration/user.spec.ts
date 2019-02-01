/*
// @ts-ignore
import { inspect } from 'util'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { PromiseAll } from '@vevey/common'
import { createCognito } from '../connectors/Cognito'
import { Auth } from '../models/Auth'
import app from '../app'
import {
  // @ts-ignore
  print,
  throwIfError,
  request,
} from './helper.spec'

// @ts-ignore
const confirmSignUp = ({ email, inviteCode, newPassword }) => {
  const query = `mutation {
    confirmSignUp(
      email: "${email}"
      inviteCode: "${inviteCode}"
      newPassword: "${newPassword}"
    ){
      result
    }
  }`

  return request(app)
    .send({ query })
    .then(r => throwIfError(r))
}

describe('user', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const testUser = {
    email: 'success@simulator.amazonses.com',
    nickname: 'testuser',
    tempPassword: 'tempPass0)',
    password: 'validPass1!',
  }

  const auth = new Auth(createCognito())

  const deleteUser = email => {
    return auth.findUserByEmail(email)
      .then(user => user && auth.deleteUser(user.id))
  }

  beforeEach(() => {
    const { email, nickname, tempPassword } = testUser
    return auth.invite({ email, nickname, tempPassword })
  })

  afterEach(() => {
    const toDel = [testUser.email]
    return PromiseAll(toDel.map(deleteUser))
  })

  it('should signup', async function(){
    const r = await confirmSignUp({
      email: testUser.email,
      inviteCode: testUser.tempPassword,
      newPassword: testUser.password,
    })
    r.body.data.confirmSignUp
      .should.have.property('result', true)
  })

})

*/
