import './setup'
import { delay } from 'Bluebird'
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

describe('Token', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  // @ts-ignore
  const should = chai.should()

  const User = U.init()()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  describe('when create', () => {
    const { email, pwd } = testUser

    before(async () => {
      await truncateAll()
      await createUser(testUser)
    })

    it('should have ttl', async () => {
      const token = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)

      const me = await User.findByEmail(email)

      const r = await T.Model.get({
        userId: me.id,
        token: token.refreshToken,
      })
      r.should.have.property('exp').above(new Date())
      r.should.have.property('token', token.refreshToken)
    })
  })

  describe('when expires', () => {
    const { email, pwd } = testUser
    let me: U.UserPayload
    let token: T.TokenPayload
    let newToken: T.TokenPayload

    before(async () => {
      await truncateAll()
      await createUser(testUser)

      me = await User.findByEmail(email)

      T.init({ expiresIn: -1 })
      token = await createToken({ email, pwd })
        .then(r => r.body.data.createToken)
      T.init({ expiresIn: 10*60*60 })
    })

    it('should not pass auth api', async () => {
      await getMe(token)
        .should.be.rejectedWith('Unauthorized')
    })

    it('should be able to issue a new one', async () => {
      await delay(1000)
      newToken = await exchangeToken(token)
        .then(r => r.body.data.createToken)
      newToken.should.have.property('accessToken')
    })

    it('should revoke expired one when exchange', async () => {
      const r = await T.Model.get({
        userId: me.id,
        token: token.refreshToken,
      })
      should.not.exist(r)
    })

    it('should pass auth api with new one', async () => {
      const me = await getMe(newToken)
        .then(r => r.body.data.getMe)
      me.should.have.property('id')
    })

    it('should not be able to exchange with expired one', async () => {
      await exchangeToken(token)
        .should.be.rejectedWith('Unauthorized')
    })
  })

})


//// graphql queries ////

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

function exchangeToken({ refreshToken }) {
  const query = `mutation {
    createToken(
      grantType: refreshToken
      refreshToken: "${refreshToken}"
    ){
      accessToken,
      expiresIn,
      refreshToken,
    }
  }`
  return gqlRequest(app, query)
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
    truncate(T.Model, ['userId', 'token']),
  ])
}


