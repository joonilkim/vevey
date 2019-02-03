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
  throwIfError,
  request,
  truncate,
} from './helper.spec'

const saltRound = 8

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

  return request(app)
    .send({ query })
    .then(r => throwIfError(r))
}


function changePassword(token, { email, oldPwd, newPwd }){
  const query = `mutation {
    changePassword(
      oldPwd: "${oldPwd}"
      newPwd: "${newPwd}"
    ){
      result
    }
  }`

  return request(app)
    .set({ Authorization: token.accessToken })
    .send({ query })
    .then(r => throwIfError(r))
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

    it('should pass', async () => {
      const token = await login({ email, pwd })
        .then(r => r.body.data.login)

      await changePassword(token, { email, oldPwd: pwd, newPwd })
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

})

