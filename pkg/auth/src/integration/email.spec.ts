// @ts-ignore
import { inspect } from 'util'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { PromiseAll } from '@vevey/common'
import { createCognito } from '../connectors/Cognito'
import { User } from '../models/User'
import app from '../app'
import {
  // @ts-ignore
  print,
  throwIfError,
  request,
} from './helper.spec'

const invite = ({ email }) => {
  const query = `mutation {
    inviteMe(
      email: "${email}"
    ){
      result
    }
  }`

  return request(app)
    .send({ query })
    .then(r => throwIfError(r))
}

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

describe('email', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const wrongEmail = 'wrong@email'

  const testEmail = process.env.TEST_EMAIL
    || 'success@simulator.amazonses.com'

  const model= new User(createCognito())

  const deleteUser = email => {
    return model.findByEmail(email)
      .then(user => user && model.deleteUser(user.id))
  }

  afterEach(() => {
    const toDel = [testEmail, wrongEmail]
    return PromiseAll(toDel.map(deleteUser))
  })

  it('should send invitation', async function(){
    const email = testEmail

    const r = await invite({ email })
    r.body.data.inviteMe
      .should.have.property('result', true)

    const created = await model.findByEmail(email)
    created.should.have.property('email', email)

    // raise Error if already existed email
    await invite({ email })
      .should.be.rejectedWith('Conflict')
  })

  it('should not send to invalid address', async function(){
    await invite({ email: wrongEmail })
      .should.be.rejectedWith('ValidationError')
  })

})
