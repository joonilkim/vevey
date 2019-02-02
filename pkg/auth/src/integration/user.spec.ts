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

const login = (
  { email, pwd }
) => {
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


describe('User', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const testUser = {
    email: process.env.TEST_EMAIL || 'success@simulator.amazonses.com',
    pwd: 'testpasS1!',
    name: 'testuser',
  }

  const saltRound = 8

  const createUser = ({ email, pwd, name }) => {
    return new User({
      email,
      pwd: bcrypt.hashSync(pwd, saltRound),
      name,
      status: UserStatus.Confirmed,
    }).model.save()
  }

  describe('Login', () => {

    beforeEach(async () => {
      await PromiseAll([
        truncate(User.Model, ['id']),
        truncate(Token.Model, ['userId', 'token'])
      ])
      await createUser(testUser)
    })

    it('should login and logout', async () => {
      const { email, pwd } = testUser
      const r = await login({ email, pwd })
        .then(r => r.body.data.login)

      r.should.have.property('accessToken')
      r.should.have.property('refreshToken')
      r.should.have.property('expiresIn')
    })

  })

})

