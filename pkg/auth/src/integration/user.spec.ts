import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as bcrypt from 'bcrypt'
import { PromiseAll } from '@vevey/common'
import { User, UserStatus } from '../models/User'
import { Token } from '../models/Token'
import { app } from '../app'
import {
  // @ts-ignore
  print,
  gqlRequest,
  truncate,
} from './helper.spec'

const saltRound = 8


//// helpers ////

function createUser ({ email, pwd, name }) {
  return new User({
    email,
    pwd: bcrypt.hashSync(pwd, saltRound),
    name,
    status: UserStatus.Confirmed,
  }).model.save()
}

function truncateAll() {
  return PromiseAll([
    truncate(User.Model, ['id']),
    truncate(Token.Model, ['userId', 'token'])
  ])
}


//// graphql queries ////

function login({ email, pwd }, token?) {
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
  return gqlRequest(app, query, token)
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
}


describe('User', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  describe('when login', () => {
    const { email, pwd } = testUser

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should pass', async () => {
      const r = await login({ email, pwd })
        .then(r => r.body.data.login)

      r.should.have.property('accessToken')
      r.should.have.property('refreshToken')
      r.should.have.property('expiresIn')
    })

    it('should not pass with invalid password', async () => {
      const pwd = 'invalidPass1!'
      await login({ email, pwd })
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
      const token = await login({ email, pwd })
        .then(r => r.body.data.login)

      await changePassword({ email, oldPwd: pwd, newPwd }, token)
        .then(r => r.body.data.changePassword)
        .should.eventually.have.property('result', true)
    })

    it('should not login with old one', async () => {
      await login({ email, pwd })
        .should.be.rejectedWith('Unauthorized')
    })

    it('should login with new one', async () => {
      await login({ email, pwd: newPwd })
        .then(r => r.body.data.login)
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
      await login({ email, pwd: newPwd })
        .then(r => r.body.data.login)
        .should.eventually.have.property('accessToken')
    })
  })

})

