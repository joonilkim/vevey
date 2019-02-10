import { UserModel } from './models/User'
import { TokenModel } from './models/Token'
import { Mailer } from './models/Mailer'

interface Me {
  id: string
}

interface Context {
  me: Me
  User: UserModel
  Token: TokenModel
  Mailer: Mailer
}
