import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { PromiseAll } from '@vevey/common'
import { User } from '../models/User'
import { Token } from '../models/Token'
import { app } from '../app'
import {
  // @ts-ignore
  print,
  gqlRequest,
  truncate,
  throwIfError,
} from './helper.spec'

function invite({ email }){
  const query = `mutation {
    inviteMe(
      email: "${email}"
    ){
      result
    }
  }`
  return gqlRequest(app, query)
    .then(r => throwIfError(r))
}

function confirmSignUp({ email, name, code, newPwd }) {
  const query = `mutation {
    confirmSignUp(
      email: "${email}"
      name: "${name}"
      code: "${code}"
      newPwd: "${newPwd}"
    ){
      result
    }
  }`
  return gqlRequest(app, query)
    .then(r => throwIfError(r))
}

function login({ email, pwd }) {
  const query = `mutation {
    login(
      email: "${email}"
      pwd: "${pwd}"
    ){
      accessToken,
      expiresIn,
      refreshToken,
    }
  }`
  return gqlRequest(app, query)
    .then(r => throwIfError(r))
}


describe('Invite', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  before(async () => {
    await PromiseAll([
      truncate(User.Model, ['id']),
      truncate(Token.Model, ['userId', 'token'])
    ])
  })

  it('should pass', async () => {
    const email = testUser.email

    const x = await User.findByEmail(email)
    if(x) throw new Error(JSON.stringify(x))

    const r = await invite({ email })
    r.body.data.inviteMe
      .should.have.property('result', true)

    const created = await User.findByEmail(email)
    created.should.have.property('email', email)
    created.should.have.nested.property('confirmCode.code')
    created.should.have.nested.property('confirmCode.exp')

    const user = {
      email,
      name: testUser.name,
      code: created.confirmCode.code,
      newPwd: testUser.pwd,
    }
    const resp = await confirmSignUp(user)
      .then(r => r.body.data.confirmSignUp)
    resp.should.have.property('result', true)

    const { pwd } = testUser
    const t = await login({ email, pwd })
      .then(r => r.body.data.login)

    t.should.have.property('accessToken')
    t.should.have.property('refreshToken')
    t.should.have.property('expiresIn')
  })

  it('should not pass with invalid email', async () => {
    await invite({ email: 'aa@invalid'})
      .should.be.rejectedWith('ValidationError')
  })

})
