import * as assert from 'assert'
import * as request from 'request'

interface Option {
  domain?: string
  apikey?: string
  testmode: boolean
}

export const mailgun = ({ domain, apikey, testmode=false }=<Option>{}) => {
  domain = domain || process.env.MAILGUN_DOMAIN
  apikey = apikey || process.env.MAILGUN_API_KEY
  testmode = process.env.NODE_ENV !== 'production' &&
    process.env.MAILGUN_TEST !== '1'
  console.log({ testmode })

  return ({ to, subject, html }): Promise<any> => {
    assert(!!to && !!subject && !!html)

    if(!domain || !apikey) {
      return Promise.resolve({ id: 'test', message: 'test' })
    }

    return new Promise((resolve, reject) => {
      request({
        method: 'POST',
        url: `https://api.mailgun.net/v3/${domain}/messages`,
        auth: {
          user: 'api',
          pass: apikey,
        },
        form: {
          from: `Vevey <mailgun@${domain}>`,
          to,
          subject,
          html,
          'o:testmode': testmode ? 'yes' : '',
        },
        timeout: 10000,
      }, (er, res, body) => {
        return er ? reject(er) : resolve(body)
      })
    })
  }
}
