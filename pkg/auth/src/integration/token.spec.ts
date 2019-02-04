/*import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as bcrypt from 'bcrypt'
import { User, UserStatus } from '../models/User'
import { Token, TokenResponse } from '../models/Token'
import { app } from '../app'
import {
  // @ts-ignore
  print,
  gqlRequest,
  truncate,
  throwIfError,
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
  return Promise.all([
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
    .then(r => throwIfError(r))
}

describe('Token', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  describe('when expires', () => {
    const { email, pwd } = testUser
    let token: TokenResponse

    const expiresIn = Token.expiresIn
    const refreshExpiresIn = Token.refreshExpiresIn

    before(async () => {
      await truncateAll()
      await createUser(testUser)

      token = await login({ email, pwd })
        .then(r => r.body.data.login)
        .should.be.rejectedWith('Unauthorized')
    })

    after(() => {
      Token.expiresIn = expiresIn
      Token.refreshExpiresIn = refreshExpiresIn
    })

    it('should issue new one', async () => {
    })

    it('should fail to exchange with expired refreshToken', async () => {
    })
  })

})
*/
