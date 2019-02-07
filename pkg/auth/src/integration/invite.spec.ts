import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { User } from '../models/User'
import { Token } from '../models/Token'
import {
  // @ts-ignore
  print,
  createApp,
  gqlRequest,
  truncate,
  throwIfError,
} from './helper.spec'

const app = createApp()

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

function createToken({ email, pwd }) {
  const query = `mutation {
    createToken(
      grantType: credential
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

  describe('when asked', () => {
    let confirmCode: { code, exp }

    before(async () => {
      await Promise.all([
        truncate(User.Model, ['id']),
        truncate(Token.Model, ['userId', 'token'])
      ])
    })

    it('should issue code', async () => {
      const { email } = testUser

      const x = await User.findByEmail(email)
      if(x) throw new Error(JSON.stringify(x))

      const r = await invite({ email })
      r.body.data.inviteMe
        .should.have.property('result', true)

      const created = await User.findByEmail(email)
      created.should.have.property('email', email)
      created.should.have.nested.property('confirmCode.code')
      created.should.have.nested.property('confirmCode.exp')

      confirmCode = created.confirmCode
    })

    it('should confirm signup', async () => {
      const { email } = testUser

      const user = {
        email,
        name: testUser.name,
        code: confirmCode.code,
        newPwd: testUser.pwd,
      }
      const resp = await confirmSignUp(user)
        .then(r => r.body.data.confirmSignUp)
      resp.should.have.property('result', true)
    })

    it('should pass login', async () => {
      const { email, pwd } = testUser
      const t = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)

      t.should.have.property('accessToken')
      t.should.have.property('refreshToken')
      t.should.have.property('expiresIn')
    })

    it('should not pass with invalid email', async () => {
      await invite({ email: 'aa@invalid'})
        .should.be.rejectedWith('InvalidInput')
    })

  })

})
