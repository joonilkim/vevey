import { Post } from './models/Post'
import { User } from './models/User'

interface AuthPayload {
  id: string
}

interface Context {
  me: AuthPayload
  Post: Post
  User: User
}
