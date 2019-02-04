import { User } from './models/User'
import { Token } from './models/Token'

interface Me {
  id: string
}

interface Context {
  me: Me
  User: typeof User
  Token: typeof Token
}
