import * as assert from 'assert'

interface Option {
  connector: {
    sendmail: (option) => Promise<any>
  }
}

export const init = ({ connector: { sendmail }}: Option) => {
  return {
    sendInvitation: sendInvitation(sendmail),
    sendConfirmCode: sendConfirmCode(sendmail),
  }
}

export type Mailer = ReturnType<typeof init>

const sendInvitation = (sendmail) => (email, { code, exp }): Promise<void> => {
  assert(!!code && !!exp)

  const payload = {
    to: email,
    subject: 'Your invitation code',
    html: `<p>Your invitation code is ${code}</p>`,
  }
  return sendmail(payload)
}

const sendConfirmCode = (sendmail) => (email, { code, exp }): Promise<void> => {
  assert(!!code && !!exp)

  const payload = {
    to: email,
    subject: 'Your confirm code',
    html: `<p>Your confirm code is ${code}</p>`,
  }
  return sendmail(payload)
}
