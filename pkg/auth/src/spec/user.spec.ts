import './setup'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as bcrypt from 'bcrypt'
import * as U from '../models/User'
import * as T from '../models/Token'
import {
  // @ts-ignore
  print,
  createApp,
  gqlRequest,
  truncate,
  throwIfError,
} from './helper'
const { UserStatus } = U

const saltRound = 8

const app = createApp()


describe('User', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const User = U.init()()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  describe('when createToken', () => {
    const { email, pwd } = testUser

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should pass', async () => {
      const r = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)

      r.should.have.property('accessToken')
      r.should.have.property('refreshToken')
      r.should.have.property('expiresIn')
    })

    it('should not pass with invalid password', async () => {
      const pwd = 'invalidPass1!'
      await createToken({ email, pwd })
        .should.be.rejectedWith('Unauthorized')
    })
  })

  describe('when change password', () => {
    const { email, pwd } = testUser
    const newPwd = 'Newpassword1!'

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should not pass without token', async () => {
      await changePassword({ email, oldPwd: pwd, newPwd })
        .then(r => r.body.data.changePassword)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should pass', async () => {
      const token = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)

      await changePassword({ email, oldPwd: pwd, newPwd }, token)
        .then(r => r.body.data.changePassword)
        .should.eventually.have.property('result', true)
    })

    it('should not login with old one', async () => {
      await createToken({ email, pwd })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should login with new one', async () => {
      await createToken({ email, pwd: newPwd })
        .then(r => r.body.data.createToken)
        .should.eventually.have.property('accessToken')
    })
  })

  describe('when forgot password', () => {
    const { email } = testUser
    const newPwd = 'Newpassword1!'

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should reset with verification code', async () => {
      await forgotPassword({ email })
        .then(r => r.body.data.forgotPassword)
        .should.eventually.have.property('result', true)

      const user = await User.findByEmail(email)
      user.should.have.nested.property('confirmCode.code')

      const { id, confirmCode: { code } } = user
      await confirmForgotPassword({ userId: id, code, newPwd })
        .then(r => r.body.data.confirmForgotPassword)
        .should.eventually.have.property('result', true)
    })

    it('should login with new one', async () => {
      await createToken({ email, pwd: newPwd })
        .then(r => r.body.data.createToken)
        .should.eventually.have.property('accessToken')
    })
  })

  describe('when unregister', () => {
    const { email, pwd } = testUser
    let me: { id, name }

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should be logged in', async () => {
      await unregister({ pwd })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should pass', async () => {
      const token = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)
      token.should.have.property('accessToken')

      me = await getMe(token)
        .then(r => r.body.data.getMe)
      me.should.have.property('id')

      await unregister({ pwd }, token)
        .then(r => r.body.data.unregister)
        .should.eventually.have.property('result', true)
    })

    it('should not return user info', async () => {
      await User.get(me.id)
        .should.eventually.not.exist

      await User.findByEmail(email)
        .should.eventually.not.exist
    })
  })

})


//// graphql queries ////

function createToken({ email, pwd }, token?) {
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
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

function changePassword({ email, oldPwd, newPwd }, token?){
  const query = `mutation {
    changePassword(
      oldPwd: "${oldPwd}"
      newPwd: "${newPwd}"
    ){
      result
    }
  }`
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

function forgotPassword({ email }, token?) {
  const query = `mutation {
    forgotPassword(
      email: "${email}"
    ){
      result
    }
  }`
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

function confirmForgotPassword({ userId, code, newPwd }, token?) {
  const query = `mutation {
    confirmForgotPassword(
      userId: "${userId}"
      code: "${code}"
      newPwd: "${newPwd}"
    ){
      result
    }
  }`
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

function unregister({ pwd }, token?) {
  const query = `mutation {
    unregister(
      pwd: "${pwd}"
    ){
      result
    }
  }`
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}

function getMe(token?) {
  const query = `query {
    getMe {
      id
      email
      name
    }
  }`
  return gqlRequest(app, query, token)
    .then(r => throwIfError(r))
}


//// helpers ////

function createUser ({ email, pwd, name }) {
  return new U.Model({
    email,
    pwd: bcrypt.hashSync(pwd, saltRound),
    name,
    status: UserStatus.Confirmed,
  }).save()
}

function truncateAll() {
  return Promise.all([
    truncate(U.Model, ['id']),
    truncate(T.Model, ['userId', 'token'])
  ])
}
