export class Mailer {
  static sendInvitation(email, code): Promise<void> {
    return Promise.resolve()
  }
}

export const createModel = options => {
  Object.entries(options).forEach(([k, v]) => Mailer[k] = v)
  return Mailer
}

