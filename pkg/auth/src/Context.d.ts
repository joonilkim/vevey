import { User } from './models/User'

interface Me {
  id: String
}

interface Context {
  me: Me,
  User: User,
}
