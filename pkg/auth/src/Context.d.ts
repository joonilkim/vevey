import { UserModel } from './models/User'
import { TokenModel } from './models/Token'

interface Me {
  id: string
}

interface Context {
  me: Me
  User: UserModel
  Token: TokenModel
}
