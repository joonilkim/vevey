import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { mailgun } from './mailgun'

describe('Mailgun', function(){
  this.timeout(10000)
  chai.use(chaiAsPromised);
  chai.should()

  const sendmail = mailgun()

  describe('when send', () => {
    it('should pass', async () => {
      const testEmail = process.env.TEST_EMAIL

      const payload = {
        to: testEmail,
        subject: 'this is a test email',
        html: '<h2>Test</h2><p>Hello!</p>',
      }

      const data = await sendmail(payload)
        .then(parseJSON)
      data.should.have.property('id')
      data.should.have.property('message')
    })
  })
})

const parseJSON = s => {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
